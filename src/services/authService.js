// Local-only account convenience; this is not server-side authentication.

const USERS_STORAGE_KEY = "spendwise_users";
const ACTIVE_USER_STORAGE_KEY = "spendwise_active_user";
const PASSWORD_HASH_ITERATIONS = 600000;
const PREVIOUS_PASSWORD_HASH_ITERATIONS = 310000;

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  if (typeof hex !== "string" || !/^(?:[\da-f]{2})+$/i.test(hex)) return null;
  return Uint8Array.from(hex.match(/.{2}/g), (byte) => Number.parseInt(byte, 16));
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hashBuffer = await window.crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD_HASH_ITERATIONS },
    key,
    256
  );
  return new Uint8Array(hashBuffer);
}

async function createPasswordRecord(password) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return {
    algorithm: "PBKDF2-SHA-256",
    iterations: PASSWORD_HASH_ITERATIONS,
    salt: bytesToHex(salt),
    hash: bytesToHex(await hashPassword(password, salt)),
  };
}

function equalBytes(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

async function verifyPassword(password, record) {
  if (record?.algorithm === "PBKDF2-SHA-256") {
    if (
      ![PASSWORD_HASH_ITERATIONS, PREVIOUS_PASSWORD_HASH_ITERATIONS].includes(
        record.iterations
      )
    ) return false;
    const salt = hexToBytes(record.salt);
    const expectedHash = hexToBytes(record.hash);
    if (!salt || salt.length !== 16 || !expectedHash || expectedHash.length !== 32) {
      return false;
    }
    const actualHash = await hashPassword(password, salt);
    return equalBytes(actualHash, expectedHash);
  }

  // Verify and upgrade accounts created before PBKDF2 was introduced.
  if (typeof record === "string") {
    const digest = await window.crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(password)
    );
    return equalBytes(new Uint8Array(digest), hexToBytes(record));
  }
  return false;
}

function getStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read stored users:", error);
    return [];
  }
}

function saveStoredUsers(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error("Failed to save stored users:", error);
  }
}

function toPublicUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    profilePictureUrl: user.profilePictureUrl || null,
    createdAt: user.createdAt || Date.now(),
  };
}

export const authService = {
  getCurrentUser() {
    try {
      const raw = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async register({ firstName, lastName, email, password, profilePictureUrl }) {
    const trimmedFirstName = (firstName || "").trim();
    const trimmedLastName = (lastName || "").trim();
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!trimmedFirstName || trimmedFirstName.length > 60) {
      throw new Error("First name must be between 1 and 60 characters.");
    }
    if (!trimmedLastName || trimmedLastName.length > 60) {
      throw new Error("Last name must be between 1 and 60 characters.");
    }
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error("Enter a valid email address.");
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      throw new Error("Password must be between 8 and 128 characters long.");
    }

    let sanitizedPictureUrl = null;
    if (profilePictureUrl && profilePictureUrl.trim()) {
      const urlString = profilePictureUrl.trim();
      try {
        const url = new URL(urlString);
        if (url.protocol !== "https:") {
          throw new Error("Profile picture URL must use HTTPS.");
        }
        sanitizedPictureUrl = url.toString();
      } catch {
        throw new Error("Enter a valid HTTPS profile picture URL.");
      }
    }

    const users = getStoredUsers();
    const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new Error("An account with this email address already exists.");
    }

    const passwordHash = await createPasswordRecord(password);
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      email: normalizedEmail,
      passwordHash,
      profilePictureUrl: sanitizedPictureUrl,
      createdAt: Date.now(),
    };

    users.push(newUser);
    saveStoredUsers(users);
    return toPublicUser(newUser);
  },

  async login({ email, password }) {
    const normalizedEmail = (email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error("Please enter your email address.");
    }
    if (!password) {
      throw new Error("Please enter your password.");
    }

    const users = getStoredUsers();
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      throw new Error("Invalid email or password.");
    }

    if (typeof user.passwordHash === "string") {
      user.passwordHash = await createPasswordRecord(password);
      saveStoredUsers(users);
    }

    const publicUser = toPublicUser(user);
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(publicUser));
    return publicUser;
  },

  logout() {
    try {
      localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove active session:", error);
    }
  },
};
