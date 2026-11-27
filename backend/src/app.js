import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";
import settingsRoutes from "./routes/settings.js";
import { query } from "./db/database.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

export const app = express();

// Trust reverse proxy (Vercel serverless functions)
app.set("trust proxy", 1);

// HTTP Security Headers (prevents clickjacking, MIME sniffing, XSS injections)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Flexible CORS for Vercel deployments, localhost, and custom domains
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedPatterns = [
        /^http:\/\/localhost(:\d+)?$/,
        /^http:\/\/127\.0\.0\.1(:\d+)?$/,
        /^https:\/\/[a-z0-9-]+\.vercel\.app$/i,
      ];

      const clientUrl = process.env.CLIENT_URL;
      let matchesClientUrl = false;
      if (clientUrl) {
        try {
          matchesClientUrl = new URL(clientUrl).origin === origin;
        } catch {
          matchesClientUrl = false;
        }
      }

      const isAllowed = matchesClientUrl || allowedPatterns.some((pattern) => pattern.test(origin));
      if (isAllowed) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json({ limit: "2mb" }));

// General Rate Limiter (protects against API flooding and resource exhaustion)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "test" ? 1000 : 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

// Strict Authentication Rate Limiter (mitigates brute-force credential stuffing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "test" ? 1000 : 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many login/registration attempts. Please try again in 15 minutes." },
});

app.use(generalLimiter);

// Sub-router for API routes
const apiRouter = express.Router();

// Database-aware health check. This fails closed if the production DB is unavailable.
apiRouter.get("/health", async (req, res) => {
  try {
    await query("SELECT 1");
    return res.json({
      status: "healthy",
      database: "Neon PostgreSQL",
      databaseStatus: "connected",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Health Check] Database connection failed:", error.message);
    return res.status(503).json({
      status: "unhealthy",
      database: "Neon PostgreSQL",
      databaseStatus: "disconnected",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    });
  }
});

// Mount domain routes with protective limiters
apiRouter.use("/auth", authLimiter, authRoutes);
apiRouter.use("/transactions", transactionRoutes);
apiRouter.use("/settings", settingsRoutes);

// Mount under both '/api' and '/' to ensure compatibility with Vercel rewrites & local dev
app.use("/api", apiRouter);
app.use("/", apiRouter);

// Centralized Error Handling
app.use(errorHandler);

export default app;
