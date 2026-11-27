import jwt from "jsonwebtoken";
import { query } from "../db/database.js";

const JWT_SECRET = process.env.JWT_SECRET || "spendwise_default_secret_key_2026";

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No authentication token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await query(
      "SELECT id, email, first_name, last_name, profile_picture_url, created_at FROM users WHERE id = $1",
      [decoded.id]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Session invalid or user no longer exists." });
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      profilePictureUrl: user.profile_picture_url,
      createdAt: Number(user.created_at),
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }
    return res.status(401).json({ error: "Invalid authentication token." });
  }
}
