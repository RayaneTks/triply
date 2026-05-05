import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cookieParser from "cookie-parser";
import { createProxyMiddleware } from "http-proxy-middleware";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const LARAVEL_API_URL = process.env.LARAVEL_API_URL || "http://127.0.0.1:8000";

  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "Triply SPA server is running" });
  });

  // Proxy Laravel : la SPA appelle /api/v1/... sur l'origine 5173 → forwardé vers tri-api / 127.0.0.1:8000.
  // Évite CORS et permet d'attacher cookies/headers Sanctum sans configuration supplémentaire.
  // http-proxy-middleware v3 : utiliser `pathFilter` pour conserver le préfixe original
  // (un app.use("/api/v1", ...) le retirerait avant que le proxy ne le voie).
  app.use(
    createProxyMiddleware({
      pathFilter: "/api/v1",
      target: LARAVEL_API_URL,
      changeOrigin: true,
      xfwd: true,
    })
  );

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Triply SPA on http://localhost:${PORT} (API proxy → ${LARAVEL_API_URL})`);
  });
}

startServer();
