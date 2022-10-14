// handlers.js
import { rest } from "msw";
import getCharacter from "./fixtures/getCharacter.json";

const getPeople = rest.get("https://the-one-api.dev/v2/character", (req, res, ctx) => {
  return res(ctx.status(200), ctx.json(getCharacter));
});

const getPeopleError = rest.get("https://the-one-api.dev/v2/character", (req, res, ctx) => {
  return res(ctx.status(500));
});

export const handlers = {
  getPeople,
  getPeopleError,
};
