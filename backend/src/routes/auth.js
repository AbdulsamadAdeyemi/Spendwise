import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { query } from "../db/database.js";
import { authMiddleware } from "../middleware/auth.js";
import { emailService } from "../services/emailService.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "spendwise_default_secret_key_2026";

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, profilePictureUrl } = req.body;

    const trimmedFirstName = (firstName || "").trim();
    const trimmedLastName = (lastName || "").trim();
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!trimmedFirstName || trimmedFirstName.length > 60) {
      return res.status(400).json({ error: "First name must be between 1 and 60 characters." });
    }
    if (!trimmedLastName || trimmedLastName.length > 60) {
      return res.status(400).json({ error: "Last name must be between 1 and 60 characters." });
    }
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    let sanitizedPictureUrl = null;
    if (profilePictureUrl && profilePictureUrl.trim()) {
      const urlString = profilePictureUrl.trim();
      try {
        const url = new URL(urlString);
        if (url.protocol !== "https:") {
          return res.status(400).json({ error: "Profile picture URL must use HTTPS." });
        }
        sanitizedPictureUrl = url.toString();
      } catch {
        return res.status(400).json({ error: "Enter a valid HTTPS profile picture URL." });
      }
    }

    // Check if email already registered
    const existing = await query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email address already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `user_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const createdAt = Date.now();

    await query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, profile_picture_url, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [userId, normalizedEmail, passwordHash, trimmedFirstName, trimmedLastName, sanitizedPictureUrl, createdAt]);

    // Create default income plan and preferences
    await query(`
      INSERT INTO income_plans (user_id, amount, period, updated_at)
      VALUES ($1, 0, 'monthly', $2)
      ON CONFLICT (user_id) DO NOTHING
    `, [userId, createdAt]);

    await query(`
      INSERT INTO user_preferences (user_id, default_type, default_category, updated_at)
      VALUES ($1, 'expense', 'Food', $2)
      ON CONFLICT (user_id) DO NOTHING
    `, [userId, createdAt]);

    const user = {
      id: userId,
      email: normalizedEmail,
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      profilePictureUrl: sanitizedPictureUrl,
      createdAt,
    };

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: "Please provide both email and password." });
    }

    const result = await query("SELECT * FROM users WHERE email = $1", [normalizedEmail]);
    const row = result.rows[0];
    if (!row) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, row.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      profilePictureUrl: row.profile_picture_url,
      createdAt: Number(row.created_at),
    };

    const token = generateToken(user);
    res.json({ user, token });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile
router.put("/profile", authMiddleware, async (req, res, next) => {
  try {
    const { firstName, lastName, profilePictureUrl } = req.body;
    const trimmedFirstName = (firstName || req.user.firstName).trim();
    const trimmedLastName = (lastName || req.user.lastName).trim();

    let sanitizedPictureUrl = req.user.profilePictureUrl;
    if (profilePictureUrl !== undefined) {
      if (profilePictureUrl && profilePictureUrl.trim()) {
        const urlString = profilePictureUrl.trim();
        const url = new URL(urlString);
        if (url.protocol !== "https:") {
          return res.status(400).json({ error: "Profile picture URL must use HTTPS." });
        }
        sanitizedPictureUrl = url.toString();
      } else {
        sanitizedPictureUrl = null;
      }
    }

    await query(`
      UPDATE users SET first_name = $1, last_name = $2, profile_picture_url = $3 WHERE id = $4
    `, [trimmedFirstName, trimmedLastName, sanitizedPictureUrl, req.user.id]);

    const updatedUser = {
      ...req.user,
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      profilePictureUrl: sanitizedPictureUrl,
    };

    res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();

    // Generic safe response to prevent email enumeration
    const genericSuccessResponse = {
      success: true,
      message: "If an account exists with this email address, password reset instructions have been sent.",
    };

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.json(genericSuccessResponse);
    }

    const userResult = await query("SELECT id, first_name, email FROM users WHERE email = $1", [normalizedEmail]);
    const user = userResult.rows[0];

    if (!user) {
      return res.json(genericSuccessResponse);
    }

    // Generate cryptographically secure token (32 bytes hex)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const tokenId = `prt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes expiration
    const createdAt = Date.now();

    // Invalidate any previous unused reset tokens for this user
    await query("DELETE FROM password_reset_tokens WHERE user_id = $1", [user.id]);

    // Store token hash in PostgreSQL
    await query(`
      INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [tokenId, user.id, tokenHash, expiresAt, createdAt]);

    const baseUrl = process.env.APP_URL || process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${baseUrl.replace(/\/+$/, "")}/reset-password?token=${rawToken}`;

    await emailService.sendPasswordResetEmail({
      to: user.email,
      firstName: user.first_name,
      resetUrl,
    });

    res.json(genericSuccessResponse);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/verify-reset-token
router.post("/verify-reset-token", async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ valid: false, error: "Reset token is required." });
    }

    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");
    const now = Date.now();

    const result = await query(`
      SELECT id, user_id, expires_at, used_at
      FROM password_reset_tokens
      WHERE token_hash = $1
    `, [tokenHash]);

    const record = result.rows[0];
    if (!record) {
      return res.status(400).json({ valid: false, error: "Invalid password reset link." });
    }

    if (record.used_at) {
      return res.status(400).json({ valid: false, error: "This password reset link has already been used." });
    }

    if (Number(record.expires_at) < now) {
      return res.status(400).json({ valid: false, error: "This password reset link has expired. Please request a new one." });
    }

    res.json({ valid: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Reset token is required." });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");
    const now = Date.now();

    const result = await query(`
      SELECT id, user_id, expires_at, used_at
      FROM password_reset_tokens
      WHERE token_hash = $1
    `, [tokenHash]);

    const record = result.rows[0];
    if (!record) {
      return res.status(400).json({ error: "Invalid password reset link." });
    }

    if (record.used_at) {
      return res.status(400).json({ error: "This password reset link has already been used." });
    }

    if (Number(record.expires_at) < now) {
      return res.status(400).json({ error: "This password reset link has expired. Please request a new one." });
    }

    // Hash the new password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password in users table
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, record.user_id]);

    // Mark the reset token as used (single-use enforcement)
    await query("UPDATE password_reset_tokens SET used_at = $1 WHERE id = $2", [now, record.id]);

    res.json({
      success: true,
      message: "Your password has been reset successfully. You may now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
