// handlers.js
import { rest } from "msw";
import getPeople1 from "./fixtures/getPeople1.json";

const getPeopleFr = rest.get("https://swapi.dev/api/people/1", (req, res, ctx) => {
  const getPeopleData = structuredClone(getPeople1);
  getPeopleData.name = "Luc Marcheur du ciel";
  return res(ctx.status(200), ctx.json(getPeopleData));
});

const getPeopleIt = rest.get("https://swapi.dev/api/people/1", (req, res, ctx) => {
  const getPeopleData = structuredClone(getPeople1);
  getPeopleData.name = "Lucas Camminatore del cielo";
  return res(ctx.status(200), ctx.json(getPeopleData));
});

export const handlers = {
  getPeopleFr,
  getPeopleIt,
};
