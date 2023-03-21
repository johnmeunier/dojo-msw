// handlers.js
import { rest } from "msw";
import getCharacter from "./fixtures/getCharacter.json";
import getPokemonAll from "./fixtures/getPokemonAll.json";

const apiBaseUrlPokemon = "https://pokeapi.co/api/v2/";

const getPeople = rest.get("https://the-one-api.dev/v2/character", (req, res, ctx) => {
  return res(ctx.status(200), ctx.delay(1000), ctx.json(getCharacter));
});

const getPeopleError = rest.get("https://the-one-api.dev/v2/character", (req, res, ctx) => {
  return res(ctx.status(500));
});

const getPokemon = rest.get(`${apiBaseUrlPokemon}pokemon`, (req, res, ctx) => {
  const limit = Number(req.url.searchParams.get("limit"));
  const offset = Number(req.url.searchParams.get("offset"));
  const modifyGetPokemonAll = structuredClone(getPokemonAll);
  modifyGetPokemonAll.results = modifyGetPokemonAll.results.slice(offset, limit === 0 ? getPokemonAll.length : offset + limit);
  modifyGetPokemonAll.next = `${apiBaseUrlPokemon}pokemon/?offset=${offset + limit}&limit=${limit}`;
  const processedPreviousOffset = offset - limit;
  modifyGetPokemonAll.previous = processedPreviousOffset >= 0 ? `${apiBaseUrlPokemon}pokemon/?offset=${processedPreviousOffset}&limit=${limit}` : null;
  return res(ctx.delay(), ctx.status(200), ctx.json(modifyGetPokemonAll));
});

export const handlers = {
  getPeople,
  getPeopleError,
  getPokemon,
};
