import { publicProcedure } from "../../create-context";

export default publicProcedure.query(() => {
  return {
    status: "ok",
    message: "Backend is running",
    timestamp: new Date().toISOString(),
  };
});
