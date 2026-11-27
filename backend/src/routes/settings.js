import { Router } from "express";
import { query } from "../db/database.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// GET /api/settings/plan
router.get("/plan", async (req, res, next) => {
  try {
    const result = await query("SELECT amount, period FROM income_plans WHERE user_id = $1", [req.user.id]);
    const row = result.rows[0];
    if (!row) {
      return res.json({ amount: 0, period: "monthly" });
    }
    res.json({ amount: Number(row.amount), period: row.period });
  } catch (error) {
    next(error);
  }
});

// PUT /api/settings/plan
router.put("/plan", async (req, res, next) => {
  try {
    const { amount, period } = req.body;
    const parsedAmount = Math.max(0, Number(amount) || 0);
    const validPeriod = period === "yearly" ? "yearly" : "monthly";
    const now = Date.now();

    await query(`
      INSERT INTO income_plans (user_id, amount, period, updated_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        amount = EXCLUDED.amount,
        period = EXCLUDED.period,
        updated_at = EXCLUDED.updated_at
    `, [req.user.id, parsedAmount, validPeriod, now]);

    res.json({ amount: parsedAmount, period: validPeriod });
  } catch (error) {
    next(error);
  }
});

// GET /api/settings/preferences
router.get("/preferences", async (req, res, next) => {
  try {
    const result = await query("SELECT default_type, default_category FROM user_preferences WHERE user_id = $1", [req.user.id]);
    const row = result.rows[0];
    if (!row) {
      return res.json({ defaultType: "expense", defaultCategory: "Food" });
    }
    res.json({ defaultType: row.default_type, defaultCategory: row.default_category });
  } catch (error) {
    next(error);
  }
});

// PUT /api/settings/preferences
router.put("/preferences", async (req, res, next) => {
  try {
    const { defaultType, defaultCategory } = req.body;
    const validDefaultType = defaultType === "income" ? "income" : "expense";
    const validDefaultCategory = (defaultCategory || "Food").trim();
    const now = Date.now();

    await query(`
      INSERT INTO user_preferences (user_id, default_type, default_category, updated_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        default_type = EXCLUDED.default_type,
        default_category = EXCLUDED.default_category,
        updated_at = EXCLUDED.updated_at
    `, [req.user.id, validDefaultType, validDefaultCategory, now]);

    res.json({ defaultType: validDefaultType, defaultCategory: validDefaultCategory });
  } catch (error) {
    next(error);
  }
});

export default router;
