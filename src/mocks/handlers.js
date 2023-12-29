// handlers.js
import { http, HttpResponse, delay } from 'msw'
import getCharacter from "./fixtures/getCharacter.json";
import getPokemonAll from "./fixtures/getPokemonAll.json";

const apiBaseUrlPokemon = "https://pokeapi.co/api/v2/";

export const handlers = [
  http.get("https://the-one-api.dev/v2/character", async () => {
    await delay(1000);
    return HttpResponse.json(getCharacter, { status: 200 })
  }),
  // http.get("https://the-one-api.dev/v2/character", async () => {
  //   await delay();
  //   return HttpResponse(null, { status: 500 })
  // }),
  http.get(`${apiBaseUrlPokemon}pokemon`, async ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get("limit")) || 10;
    const offset = Number(url.searchParams.get("offset"));
    const modifyGetPokemonAll = structuredClone(getPokemonAll);
    console.log(modifyGetPokemonAll)
    modifyGetPokemonAll.results = modifyGetPokemonAll.results.slice(offset, limit === 0 ? getPokemonAll.length : offset + limit);
    modifyGetPokemonAll.next = `${apiBaseUrlPokemon}pokemon/?offset=${offset + limit}&limit=${limit}`;
    const processedPreviousOffset = offset - limit;
    modifyGetPokemonAll.previous = processedPreviousOffset >= 0 ? `${apiBaseUrlPokemon}pokemon/?offset=${processedPreviousOffset}&limit=${limit}` : null;
    console.log(modifyGetPokemonAll);
    await delay();
    return HttpResponse.json(modifyGetPokemonAll, { status: 200 })
  })
]