import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { initializeDatabase } from "./db/postgres";
import { existsSync } from "fs";
import { resolve } from "path";

const app = new Hono();

initializeDatabase().then((initialized) => {
  if (initialized) {
    console.log('🚀 PostgreSQL database ready');
  } else {
    console.log('⚠️  Using in-memory database fallback');
  }
}).catch((error) => {
  console.error('Database initialization error:', error);
});

app.use("*", cors());

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

app.get("/api/health", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

const distPath = resolve(process.cwd(), "dist");
const hasWebBuild = existsSync(distPath);

if (hasWebBuild) {
  console.log('📦 Serving frontend from', distPath);
  
  app.use("/*", serveStatic({ root: "./dist" }));
  
  app.get("*", serveStatic({ path: "./dist/index.html" }));
} else {
  console.log('⚠️  No web build found. Run "bunx expo export -p web" first.');
  app.get("/", (c) => {
    return c.json({ status: "ok", message: "Backend running. Frontend not built." });
  });
}

export default app;
