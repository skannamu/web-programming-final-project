const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db/pool");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  process.env.FRONTEND_URL,
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("FocusGuard Backend Server Running");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "FocusGuard API is working",
  });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");
    res.json({
      status: "db connected",
      time: result.rows[0].current_time,
    });
  } catch (error) {
    res.status(500).json({
      status: "db error",
      message: error.message,
    });
  }
});


app.get("/api/init-db", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS focus_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(100),
        duration INTEGER NOT NULL,
        keypress_count INTEGER DEFAULT 0,
        click_count INTEGER DEFAULT 0,
        tab_hidden_count INTEGER DEFAULT 0,
        focus_score INTEGER DEFAULT 0,
        memo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const userResult = await pool.query("SELECT * FROM users WHERE id = 1");

    if (userResult.rows.length === 0) {
      await pool.query("INSERT INTO users (name) VALUES ($1)", ["Demo User"]);
    }

    res.json({ message: "Database initialized successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/sessions", async (req, res) => {
  try {
    const {
      userId,
      title,
      duration,
      keypressCount,
      clickCount,
      tabHiddenCount,
      focusScore,
      memo,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO focus_sessions
      (user_id, title, duration, keypress_count, click_count, tab_hidden_count, focus_score, memo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        userId,
        title,
        duration,
        keypressCount,
        clickCount,
        tabHiddenCount,
        focusScore,
        memo,
      ]
    );

    res.status(201).json({
      message: "Session saved successfully",
      session: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/sessions", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        fs.id,
        fs.title,
        fs.duration,
        fs.keypress_count,
        fs.click_count,
        fs.tab_hidden_count,
        fs.focus_score,
        fs.memo,
        fs.created_at,
        u.name AS user_name
      FROM focus_sessions fs
      JOIN users u ON fs.user_id = u.id
      ORDER BY fs.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*)::int AS total_sessions,
        COALESCE(SUM(duration), 0)::int AS total_duration,
        COALESCE(ROUND(AVG(focus_score)), 0)::int AS average_focus_score,
        COALESCE(SUM(keypress_count), 0)::int AS total_keypress,
        COALESCE(SUM(click_count), 0)::int AS total_click,
        COALESCE(SUM(tab_hidden_count), 0)::int AS total_tab_hidden
      FROM focus_sessions`
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/api/sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM focus_sessions WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({
      message: "Session deleted successfully",
      deletedSession: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
