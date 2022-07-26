// handlers.js
import { rest } from "msw";
export const handlers = [
  rest.get("/quote", {
    an: "awesome",
    axa: "quote",
  }),
];
