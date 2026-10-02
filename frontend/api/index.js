"use strict";
/**
 * Vercel serverless entry. vercel.json rewrites /api/*, /notify/* and /analytics/* to this one function.
 * GET /api/health shows whether the env variables exist and whether MongoDB Atlas is reachable.
 */
const app = require("../server/app");

module.exports = async (req, res) => {
  let p = "";
  try {
    p = new URL(req.url || "/", "http://localhost").pathname.replace(
      /\/+$/,
      "",
    );
  } catch {
    p = "";
  }

  if (p === "/api/health" || p === "/api") {
    const out = {
      status: "UP",
      MONGO_URI: !!process.env.MONGO_URI,
      JWT_SECRET: !!process.env.JWT_SECRET,
      db: "not checked",
    };
    try {
      if (process.env.MONGO_URI) {
        const { MongoClient } = require("mongodb");
        const c = new MongoClient(process.env.MONGO_URI, {
          serverSelectionTimeoutMS: 5000,
        });
        await c.connect();
        await c.db().command({ ping: 1 });
        await c.close();
        out.db = "connected";
      }
    } catch (e) {
      out.db = "ERROR: " + ((e && e.name) || "unknown");
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(out));
    return;
  }

  return app(req, res);
};
