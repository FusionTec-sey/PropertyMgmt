import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import healthRoute from "./routes/health/route";
import syncRoute from "./routes/data/sync/route";

export const appRouter = createTRPCRouter({
  health: healthRoute,
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  data: createTRPCRouter({
    sync: syncRoute,
  }),
});

export type AppRouter = typeof appRouter;
