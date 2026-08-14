import { defineConfig } from "vite";
import { appendFile, copyFile, mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const LOG_ROUTE = "/__hare-log";
const MAX_LOG_BODY_CHARACTERS = 1024 * 1024;
const SESSION_FILE_PATTERN = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-\d{3}_[a-z0-9]{6}\.log$/;
const require = createRequire(import.meta.url);
const loggingBootstrap = require.resolve(
  "ba-memorylobby-wallpaper-runtime/logging-bootstrap.js",
);

function runtimeAssets() {
  return {
    name: "memory-lobby-runtime-assets",
    configureServer(server: any) {
      server.middlewares.use(async (request: any, response: any, next: () => void) => {
        const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
        if (pathname !== "/logging-bootstrap.js") return next();
        response.setHeader("Content-Type", "text/javascript; charset=utf-8");
        response.end(await readFile(loggingBootstrap));
      });
    },
    async writeBundle() {
      await copyFile(loggingBootstrap, path.resolve("dist", "logging-bootstrap.js"));
    },
  };
}

function localLogBridge() {
  const logDirectory = path.resolve("dist", "log");

  const installMiddleware = (server: {
    middlewares: {
      use: (handler: (request: any, response: any, next: () => void) => void) => void;
    };
  }) => {
    server.middlewares.use((request, response, next) => {
      const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
      if (request.method === "POST" && pathname === `${LOG_ROUTE}/append`) {
        let body = "";
        let rejected = false;
        request.setEncoding("utf8");
        request.on("data", (chunk: string) => {
          if (rejected) return;
          if (body.length + chunk.length > MAX_LOG_BODY_CHARACTERS) {
            rejected = true;
            response.statusCode = 413;
            response.end("Log payload too large");
            return;
          }
          body += chunk;
        });
        request.on("end", async () => {
          if (rejected || response.writableEnded) return;
          try {
            const payload = JSON.parse(body) as {
              sessionFile?: unknown;
              lines?: unknown;
            };
            if (
              typeof payload.sessionFile !== "string" ||
              !SESSION_FILE_PATTERN.test(payload.sessionFile) ||
              !Array.isArray(payload.lines) ||
              payload.lines.some((line) => typeof line !== "string")
            ) {
              response.statusCode = 400;
              response.end("Invalid log payload");
              return;
            }
            await mkdir(logDirectory, { recursive: true });
            await appendFile(
              path.join(logDirectory, payload.sessionFile),
              `${payload.lines.join("\n")}\n`,
              "utf8",
            );
            response.statusCode = 204;
            response.end();
          } catch (error) {
            if (response.writableEnded) return;
            if (error instanceof SyntaxError) {
              response.statusCode = 400;
              response.end("Invalid JSON payload");
              return;
            }
            response.statusCode = 500;
            response.end(error instanceof Error ? error.message : String(error));
          }
        });
        return;
      }

      next();
    });
  };

  return {
    name: "hare-local-log-bridge",
    configureServer: installMiddleware,
    configurePreviewServer: installMiddleware,
    async writeBundle() {
      await mkdir(logDirectory, { recursive: true });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [runtimeAssets(), localLogBridge()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    target: "chrome90",
  },
});
