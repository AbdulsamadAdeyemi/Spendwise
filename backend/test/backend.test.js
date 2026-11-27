import { newDb } from "pg-mem";
import crypto from "crypto";
import { setTestPool } from "../src/db/database.js";
import { SCHEMA_SQL } from "../src/db/schema.js";
import { app } from "../src/app.js";

// Initialize PostgreSQL in-memory database for testing
const mem = newDb();
const pg = mem.adapters.createPg();
const pool = new pg.Pool();

setTestPool(pool);

const PORT = 5097;
const BASE_URL = `http://localhost:${PORT}/api`;

let server;
let aliceToken = null;
let aliceUser = null;
let bobToken = null;
let bobUser = null;
let aliceTxId = null;

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  PASS: ${message}`);
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("   SPENDWISE POSTGRESQL + VERCEL INTEGRATION TESTS");
  console.log("=======================================================\n");

  try {
    // Setup Database Schema
    console.log("Suite 1: Database Migration & Schema Creation");
    await pool.query(SCHEMA_SQL);
    assert(true, "PostgreSQL schema created successfully with all tables and indexes");

    // Start test server
    server = app.listen(PORT);
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Suite 2: Health Check
    console.log("\nSuite 2: Server Health Check");
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, "GET /api/health returned 200 OK");
    assert(healthData.status === "healthy", "Health status is 'healthy'");
    assert(healthData.database === "Neon PostgreSQL", "Reports database as 'Neon PostgreSQL'");

    // Suite 3: User Authentication
    console.log("\nSuite 3: User Authentication & Registration");

    // Invalid registration input
    const invalidRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: "", lastName: "", email: "bad-email", password: "123" }),
    });
    assert(invalidRegRes.status === 400, "Rejects registration with invalid data (HTTP 400)");

    // Valid registration for Alice
    const aliceRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@example.com",
        password: "Password123!",
      }),
    });
    const aliceRegData = await aliceRegRes.json();
    assert(aliceRegRes.status === 201, "Alice registered successfully (HTTP 201)");
    assert(!!aliceRegData.token, "JWT token returned upon registration");
    assert(aliceRegData.user.email === "alice@example.com", "User email correctly matches");
    aliceToken = aliceRegData.token;
    aliceUser = aliceRegData.user;

    // Verify password is NOT stored in plaintext
    const dbUserRes = await pool.query("SELECT password_hash FROM users WHERE email = $1", ["alice@example.com"]);
    const storedHash = dbUserRes.rows[0].password_hash;
    assert(storedHash !== "Password123!", "Password is cryptographically hashed (not plaintext)");
    assert(storedHash.startsWith("$2"), "Password is encrypted with standard bcrypt hash format");

    // Duplicate registration should return 409
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Alice",
        lastName: "Duplicate",
        email: "alice@example.com",
        password: "Password123!",
      }),
    });
    assert(dupRes.status === 409, "Rejects duplicate email with HTTP 409 Conflict");

    // Login with wrong password
    const wrongPassRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alice@example.com", password: "WrongPassword" }),
    });
    assert(wrongPassRes.status === 401, "Rejects incorrect password with HTTP 401");

    // Login with correct password
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alice@example.com", password: "Password123!" }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, "Alice logged in successfully (HTTP 200)");
    assert(!!loginData.token, "Login returns fresh valid JWT token");

    // Register Bob for multi-tenant isolation tests
    const bobRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Bob",
        lastName: "Jones",
        email: "bob@example.com",
        password: "BobPassword456!",
      }),
    });
    const bobRegData = await bobRegRes.json();
    assert(bobRegRes.status === 201, "Bob registered successfully (HTTP 201)");
    bobToken = bobRegData.token;
    bobUser = bobRegData.user;

    // Suite 4: JWT Verification and Profile
    console.log("\nSuite 4: JWT Authorization & User Profile");

    // Request without token
    const noTokenRes = await fetch(`${BASE_URL}/auth/me`);
    assert(noTokenRes.status === 401, "Protected route rejects unauthenticated request (HTTP 401)");

    // Request with invalid token
    const badTokenRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: "Bearer invalid.jwt.token" },
    });
    assert(badTokenRes.status === 401, "Protected route rejects malformed token (HTTP 401)");

    // Request with Alice's token
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, "Protected route allows valid JWT token (HTTP 200)");
    assert(meData.user.id === aliceUser.id, "Profile returns correct user ID");

    // Update Profile
    const updateProfileRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({
        firstName: "Alicia",
        lastName: "Smith-Doe",
        profilePictureUrl: "https://example.com/alicia.jpg",
      }),
    });
    const updateProfileData = await updateProfileRes.json();
    assert(updateProfileRes.status === 200, "Profile updated successfully (HTTP 200)");
    assert(updateProfileData.user.firstName === "Alicia", "Updated first name persists");
    assert(updateProfileData.user.profilePictureUrl === "https://example.com/alicia.jpg", "Updated avatar URL persists");

    // Suite 5: Transactions CRUD Operations
    console.log("\nSuite 5: Transactions CRUD Operations");

    // Create an expense
    const createTx1 = await fetch(`${BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({
        description: "Weekly Grocery Market",
        amount: 85.50,
        type: "expense",
        category: "Food",
        date: "2026-11-20",
        wallet: "Personal",
      }),
    });
    const tx1Data = await createTx1.json();
    assert(createTx1.status === 201, "Created expense transaction (HTTP 201)");
    assert(tx1Data.amount === 85.50, "Transaction amount is 85.50");
    assert(tx1Data.type === "expense", "Transaction type is 'expense'");
    aliceTxId = tx1Data.id;

    // Create an income
    const createTx2 = await fetch(`${BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({
        description: "Freelance Design Retainer",
        amount: 2500.00,
        type: "income",
        category: "Income",
        date: "2026-11-22",
        wallet: "Business",
      }),
    });
    assert(createTx2.status === 201, "Created income transaction (HTTP 201)");

    // List Alice's transactions
    const listTxRes = await fetch(`${BASE_URL}/transactions`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const listTxData = await listTxRes.json();
    assert(listTxRes.status === 200, "Listed transactions (HTTP 200)");
    assert(listTxData.length === 2, "Alice has exactly 2 transactions in PostgreSQL");
    assert(listTxData[0].date >= listTxData[1].date, "Transactions sorted descending by date");

    // Update Alice's transaction
    const updateTxRes = await fetch(`${BASE_URL}/transactions/${aliceTxId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({
        description: "Organic Supermarket",
        amount: 92.00,
        type: "expense",
        category: "Food",
        date: "2026-11-20",
        wallet: "Personal",
      }),
    });
    const updateTxData = await updateTxRes.json();
    assert(updateTxRes.status === 200, "Updated transaction (HTTP 200)");
    assert(updateTxData.description === "Organic Supermarket", "Updated description persists");
    assert(updateTxData.amount === 92.00, "Updated amount persists");

    // Suite 6: Multi-Tenant Data Isolation (Security Audit)
    console.log("\nSuite 6: Multi-Tenant User Data Isolation");

    // Bob views transactions
    const bobListRes = await fetch(`${BASE_URL}/transactions`, {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    const bobListData = await bobListRes.json();
    assert(bobListData.length === 0, "Bob cannot see Alice's transactions (returns empty array)");

    // Bob attempts to modify Alice's transaction
    const bobTamperRes = await fetch(`${BASE_URL}/transactions/${aliceTxId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bobToken}`,
      },
      body: JSON.stringify({
        description: "Hacked Description",
        amount: 9999,
        type: "expense",
        category: "Food",
        date: "2026-11-20",
        wallet: "Personal",
      }),
    });
    assert(bobTamperRes.status === 404, "Bob cannot modify Alice's transaction (HTTP 404)");

    // Bob attempts to delete Alice's transaction
    const bobDeleteRes = await fetch(`${BASE_URL}/transactions/${aliceTxId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    assert(bobDeleteRes.status === 404, "Bob cannot delete Alice's transaction (HTTP 404)");

    // Verify Alice's transaction is still intact
    const aliceVerifyRes = await fetch(`${BASE_URL}/transactions`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const aliceVerifyData = await aliceVerifyRes.json();
    assert(aliceVerifyData.length === 2, "Alice's transactions remained completely untouched and isolated");

    // Suite 7: Settings and Preferences Persistence
    console.log("\nSuite 7: Settings & Income Plan Persistence");

    // Default plan
    const defaultPlanRes = await fetch(`${BASE_URL}/settings/plan`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const defaultPlanData = await defaultPlanRes.json();
    assert(defaultPlanData.amount === 0, "Initial default income plan amount is 0");

    // Save income plan
    const savePlanRes = await fetch(`${BASE_URL}/settings/plan`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({ amount: 6500, period: "monthly" }),
    });
    const savePlanData = await savePlanRes.json();
    assert(savePlanRes.status === 200, "Saved income plan (HTTP 200)");
    assert(savePlanData.amount === 6500, "Income plan amount set to 6500");

    // Bob gets his own plan (isolated)
    const bobPlanRes = await fetch(`${BASE_URL}/settings/plan`, {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    const bobPlanData = await bobPlanRes.json();
    assert(bobPlanData.amount === 0, "Bob's plan is isolated and independent of Alice's plan");

    // Save user preferences
    const savePrefRes = await fetch(`${BASE_URL}/settings/preferences`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({ defaultType: "expense", defaultCategory: "Utilities" }),
    });
    const savePrefData = await savePrefRes.json();
    assert(savePrefRes.status === 200, "Saved preferences (HTTP 200)");
    assert(savePrefData.defaultCategory === "Utilities", "Default category set to 'Utilities'");

    // Suite 8: Batch Sync API (/api/transactions/sync)
    console.log("\nSuite 8: Client Sync API (/api/transactions/sync)");
    const syncRes = await fetch(`${BASE_URL}/transactions/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({
        transactions: [
          {
            id: "tx_offline_1",
            description: "Coffee & Pastry",
            amount: 7.25,
            type: "expense",
            category: "Food",
            date: "2026-11-24",
            wallet: "Personal",
          },
          {
            id: "tx_offline_2",
            description: "Client Bonus",
            amount: 500.00,
            type: "income",
            category: "Income",
            date: "2026-11-25",
            wallet: "Personal",
          },
        ],
      }),
    });
    const syncData = await syncRes.json();
    assert(syncRes.status === 200, "Batch sync executed successfully (HTTP 200)");
    assert(syncData.length === 4, "Synced offline transactions into PostgreSQL (total 4)");

    // Delete a transaction as Alice
    const deleteTxRes = await fetch(`${BASE_URL}/transactions/${aliceTxId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(deleteTxRes.status === 200, "Alice deleted her own transaction (HTTP 200)");

    const finalListRes = await fetch(`${BASE_URL}/transactions`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const finalListData = await finalListRes.json();
    assert(finalListData.length === 3, "Transaction count reduced to 3 after deletion");

    // Suite 9: Forgot Password & Password Reset Flow
    console.log("\nSuite 9: Forgot Password & Cryptographic Token Reset Flow");

    // 1. Request reset with malformed email (still returns generic 200 to prevent user enumeration)
    const badEmailRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    const badEmailData = await badEmailRes.json();
    assert(badEmailRes.status === 200, "Malformed email returns generic 200 OK (no enumeration)");
    assert(badEmailData.success === true, "Generic success returned for malformed email");

    // 2. Request reset with non-existent email (must return generic 200 to prevent user enumeration)
    const nonExistentEmailRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ghost_user_12345@example.com" }),
    });
    const nonExistentEmailData = await nonExistentEmailRes.json();
    assert(nonExistentEmailRes.status === 200, "Non-existent email returns generic 200 OK (no enumeration)");
    assert(
      nonExistentEmailData.message.includes("If an account exists"),
      "Returns anti-enumeration security message"
    );

    // 3. Request reset for Bob (existing user)
    const bobForgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bob@example.com" }),
    });
    assert(bobForgotRes.status === 200, "Password reset request accepted for Bob (HTTP 200)");

    // 4. Verify token was hashed and stored in PostgreSQL
    const tokenDbRes = await pool.query(
      "SELECT * FROM password_reset_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [bobUser.id]
    );
    assert(tokenDbRes.rows.length === 1, "Reset token stored in PostgreSQL database");
    const storedTokenRow = tokenDbRes.rows[0];
    assert(!!storedTokenRow.token_hash, "Token hash is present in database");
    assert(storedTokenRow.token_hash.length === 64, "Token hash is a 64-character SHA-256 hex digest");
    assert(storedTokenRow.used_at === null, "Token starts with used_at = NULL (unused)");
    assert(Number(storedTokenRow.expires_at) > Date.now(), "Token expires in the future");

    // 5. Test verify-reset-token with bogus token
    const verifyBogusRes = await fetch(`${BASE_URL}/auth/verify-reset-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "bogus-hex-token-that-does-not-exist" }),
    });
    const verifyBogusData = await verifyBogusRes.json();
    assert(verifyBogusData.valid === false, "Rejects non-existent reset token (valid: false)");

    // 6. Test with known token
    const testRawToken = "test-bob-single-use-token-abcdef0123456789";
    const testHash = crypto.createHash("sha256").update(testRawToken).digest("hex");
    const futureExpiry = Date.now() + 15 * 60 * 1000;
    await pool.query(
      "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at) VALUES ($1, $2, $3, $4, $5)",
      [crypto.randomUUID(), bobUser.id, testHash, futureExpiry, Date.now()]
    );

    // 7. Verify valid token endpoint
    const verifyValidRes = await fetch(`${BASE_URL}/auth/verify-reset-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: testRawToken }),
    });
    const verifyValidData = await verifyValidRes.json();
    assert(verifyValidRes.status === 200, "Valid token verification returns 200 OK");
    assert(verifyValidData.valid === true, "Token confirmed valid (valid: true)");

    // 8. Attempt password reset with password < 8 characters
    const shortPassRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: testRawToken, password: "short" }),
    });
    assert(shortPassRes.status === 400, "Rejects new password shorter than 8 chars (HTTP 400)");

    // 9. Successfully reset password for Bob
    const resetSuccessRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: testRawToken, password: "BobNewStrongPassword2026!" }),
    });
    const resetSuccessData = await resetSuccessRes.json();
    assert(resetSuccessRes.status === 200, "Password reset succeeds (HTTP 200)");
    assert(resetSuccessData.success === true, "Response indicates success: true");

    // 10. Verify single-use token invalidation in PostgreSQL
    const tokenAfterUse = await pool.query(
      "SELECT used_at FROM password_reset_tokens WHERE token_hash = $1",
      [testHash]
    );
    assert(tokenAfterUse.rows[0].used_at !== null, "Token used_at timestamp is set in PostgreSQL");

    // 11. Attempt to reuse the already used token
    const reuseRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: testRawToken, password: "AnotherNewPassword123!" }),
    });
    assert(reuseRes.status === 400, "Rejects already used token (HTTP 400)");

    // 12. Verify used token fails verify-reset-token check
    const verifyUsedRes = await fetch(`${BASE_URL}/auth/verify-reset-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: testRawToken }),
    });
    const verifyUsedData = await verifyUsedRes.json();
    assert(verifyUsedData.valid === false, "Used token fails verification (valid: false)");

    // 13. Test expired token
    const expiredRawToken = "expired-token-xyz-123456789";
    const expiredHash = crypto.createHash("sha256").update(expiredRawToken).digest("hex");
    const pastExpiry = Date.now() - 1000 * 60 * 5; // 5 minutes ago
    await pool.query(
      "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at) VALUES ($1, $2, $3, $4, $5)",
      [crypto.randomUUID(), bobUser.id, expiredHash, pastExpiry, Date.now() - 1000 * 60 * 10]
    );

    const expiredVerifyRes = await fetch(`${BASE_URL}/auth/verify-reset-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: expiredRawToken }),
    });
    const expiredVerifyData = await expiredVerifyRes.json();
    assert(expiredVerifyData.valid === false, "Expired token fails verification (valid: false)");

    const expiredResetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: expiredRawToken, password: "ExpiredTestPassword123!" }),
    });
    assert(expiredResetRes.status === 400, "Rejects reset attempt with expired token (HTTP 400)");

    // 14. Verify old password no longer works
    const oldLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bob@example.com", password: "BobPassword456!" }),
    });
    assert(oldLoginRes.status === 401, "Old password rejected after reset (HTTP 401)");

    // 15. Verify new password works
    const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bob@example.com", password: "BobNewStrongPassword2026!" }),
    });
    const newLoginData = await newLoginRes.json();
    assert(newLoginRes.status === 200, "Bob logs in with new password (HTTP 200)");
    assert(!!newLoginData.token, "New JWT token issued for Bob with new password");

    console.log("\n=======================================================");
    console.log(`  ALL ${passedTests} TESTS PASSED SUCCESSFULLY! (${totalTests}/${totalTests})`);
    console.log("=======================================================\n");
  } catch (error) {
    console.error("\nTEST SUITE FAILED:", error);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    process.exit(process.exitCode || 0);
  }
}

runTests();
