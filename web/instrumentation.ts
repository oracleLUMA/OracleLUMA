export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initDB } = await import("./lib/init-db");
    await initDB();
    const { startScheduler } = await import("./lib/scheduler");
    startScheduler();
  }
}
