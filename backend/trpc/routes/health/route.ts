import { publicProcedure } from "@/backend/trpc/create-context";

export default publicProcedure.query(() => {
  return {
    status: "ok",
    message: "Backend is running",
    timestamp: new Date().toISOString(),
  };
});
