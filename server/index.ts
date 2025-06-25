import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* -------- request logger -------- */
app.use((req, res, next) => {
  const start = Date.now();
  const requestPath = req.path;
  let capturedJson: Record<string, unknown> | undefined;

  // capture res.json output
  const originalJson = res.json.bind(res);
  res.json = function (body, ...args) {
    capturedJson = body;
    return originalJson(body, ...args);
  };

  res.on("finish", () => {
    if (!requestPath.startsWith("/api")) return;

    const duration = Date.now() - start;
    let line = `${req.method} ${requestPath} ${res.statusCode} in ${duration}ms`;
    if (capturedJson) line += ` :: ${JSON.stringify(capturedJson)}`;
    if (line.length > 80) line = line.slice(0, 79) + "…";
    log(line);
  });

  next();
});

(async () => {
  const server = createServer(app);

  /* -------- API & routes -------- */
  await registerRoutes(app, server);

  /* -------- global error handler -------- */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  /* -------- dev / prod frontend -------- */
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  /* -------- start the server -------- */
  // Use Replit's PORT, or REPLIT_PORT environment variables if available, otherwise fallback to 3000
  const PORT = process.env.PORT || process.env.REPLIT_PORT || 3000;
  server.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on :${PORT}`);
    console.log(`http://localhost:${PORT}`);
  });
})();
