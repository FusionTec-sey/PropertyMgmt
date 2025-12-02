import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { initializeDatabase } from "./db/postgres";

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

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;
