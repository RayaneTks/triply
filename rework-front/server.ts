import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cookieParser from "cookie-parser";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Triply Backend is running" });
  });

  // Auth mock for v1 refit
  app.post("/api/v1/auth/login", (req, res) => {
    const { email } = req.body;
    res.cookie("triply_session", "mock_session_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.json({ success: true, user: { name: "Traveler", email } });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Triply server running on http://localhost:${PORT}`);
  });
}

startServer();
