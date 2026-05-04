import { markNoShowAppointments } from "../controllers/scheduling.controller.js";

const DEFAULT_GRACE_MINUTES = 15;
const DEFAULT_SCAN_INTERVAL_MS = 60 * 1000;

export const startNoShowWatcher = () => {
  const graceMinutes = Number(process.env.NO_SHOW_GRACE_MINUTES || DEFAULT_GRACE_MINUTES);
  const scanIntervalMs = Number(process.env.NO_SHOW_SCAN_INTERVAL_MS || DEFAULT_SCAN_INTERVAL_MS);

  const tick = async () => {
    try {
      const result = await markNoShowAppointments(graceMinutes);
      if (result.updated > 0) {
        console.log(`⏰ No-show watcher marked ${result.updated} appointments as no_show`);
      }
    } catch (error) {
      console.error("No-show watcher failed:", error.message);
    }
  };

  tick();
  const timer = setInterval(tick, scanIntervalMs);
  return timer;
};

