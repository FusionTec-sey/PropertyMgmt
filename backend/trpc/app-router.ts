import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import healthRoute from "./routes/health/route";

export const appRouter = createTRPCRouter({
  health: healthRoute,
  example: createTRPCRouter({
    hi: hiRoute,
  }),
});

export type AppRouter = typeof appRouter;
