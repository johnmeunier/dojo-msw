import { setupWorker } from "msw";
import { register } from "msw-ui";
import { handlers } from "./handlers";

export const worker = setupWorker();
register(worker, handlers);
