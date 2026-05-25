import { startMultiUserScheduler } from "./lib/multi-user-scheduler";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    startMultiUserScheduler();
  }
}