// handlers.js
import { rest } from "msw";
import getPeople1 from "./fixtures/getPeople1.json";

export const handlers = [
  rest.get("https://swapi.dev/api/people/1", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(getPeople1));
  }),
];
