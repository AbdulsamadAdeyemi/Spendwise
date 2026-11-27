import { Router } from "express";
import crypto from "node:crypto";
import { query } from "../db/database.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// GET /api/transactions
router.get("/", async (req, res, next) => {
  try {
    const result = await query(`
      SELECT id, user_id as "userId", description, description as name, amount, type, category, date, wallet, created_at as "createdAt"
      FROM transactions
      WHERE user_id = $1
      ORDER BY date DESC, created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// POST /api/transactions
router.post("/", async (req, res, next) => {
  try {
    const { id, description, name, amount, type, category, date, wallet } = req.body;

    const trimmedDescription = (description || name || "").trim();
    const parsedAmount = Number(amount);
    const validTypes = ["income", "expense"];

    if (!trimmedDescription) {
      return res.status(400).json({ error: "Transaction description is required." });
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number." });
    }
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Type must be 'income' or 'expense'." });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Valid date format (YYYY-MM-DD) is required." });
    }

    const transactionId = id || `tx_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const cleanCategory = (category || (type === "income" ? "Income" : "Other")).trim();
    const cleanWallet = (wallet || "Personal").trim();
    const createdAt = Date.now();

    await query(`
      INSERT INTO transactions (id, user_id, description, amount, type, category, date, wallet, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [transactionId, req.user.id, trimmedDescription, parsedAmount, type, cleanCategory, date, cleanWallet, createdAt]);

    const createdTx = {
      id: transactionId,
      userId: req.user.id,
      description: trimmedDescription,
      name: trimmedDescription,
      amount: parsedAmount,
      type,
      category: cleanCategory,
      wallet: cleanWallet,
      date,
      createdAt,
    };

    res.status(201).json(createdTx);
  } catch (error) {
    next(error);
  }
});

// PUT /api/transactions/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, name, amount, type, category, date, wallet } = req.body;

    const existing = await query("SELECT id FROM transactions WHERE id = $1 AND user_id = $2", [id, req.user.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found or access denied." });
    }

    const trimmedDescription = (description || name || "").trim();
    const parsedAmount = Number(amount);
    const validTypes = ["income", "expense"];

    if (!trimmedDescription) {
      return res.status(400).json({ error: "Transaction description is required." });
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number." });
    }
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Type must be 'income' or 'expense'." });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Valid date format (YYYY-MM-DD) is required." });
    }

    const cleanCategory = (category || (type === "income" ? "Income" : "Other")).trim();
    const cleanWallet = (wallet || "Personal").trim();

    await query(`
      UPDATE transactions
      SET description = $1, amount = $2, type = $3, category = $4, date = $5, wallet = $6
      WHERE id = $7 AND user_id = $8
    `, [trimmedDescription, parsedAmount, type, cleanCategory, date, cleanWallet, id, req.user.id]);

    const updatedTx = {
      id,
      userId: req.user.id,
      description: trimmedDescription,
      name: trimmedDescription,
      amount: parsedAmount,
      type,
      category: cleanCategory,
      date,
      wallet: cleanWallet,
    };

    res.json(updatedTx);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/transactions/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM transactions WHERE id = $1 AND user_id = $2", [id, req.user.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Transaction not found or already deleted." });
    }

    res.json({ success: true, id });
  } catch (error) {
    next(error);
  }
});

// POST /api/transactions/sync (Bulk sync from client localStorage)
router.post("/sync", async (req, res, next) => {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions)) {
      return res.status(400).json({ error: "Transactions array is required." });
    }

    for (const tx of transactions) {
      const desc = (tx.description || tx.name || "").trim();
      if (!tx.id || !desc || !tx.amount) continue;
      await query(`
        INSERT INTO transactions (id, user_id, description, amount, type, category, date, wallet, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          description = EXCLUDED.description,
          amount = EXCLUDED.amount,
          type = EXCLUDED.type,
          category = EXCLUDED.category,
          date = EXCLUDED.date,
          wallet = EXCLUDED.wallet,
          created_at = EXCLUDED.created_at
      `, [
        String(tx.id),
        req.user.id,
        desc,
        Number(tx.amount),
        tx.type === "income" ? "income" : "expense",
        (tx.category || "Other").trim(),
        tx.date || new Date().toISOString().split("T")[0],
        (tx.wallet || "Personal").trim(),
        Number(tx.createdAt) || Date.now(),
      ]);
    }

    // Return the fresh full list
    const all = await query(`
      SELECT id, user_id as "userId", description, description as name, amount, type, category, date, wallet, created_at as "createdAt"
      FROM transactions
      WHERE user_id = $1
      ORDER BY date DESC, created_at DESC
    `, [req.user.id]);

    res.json(all.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
