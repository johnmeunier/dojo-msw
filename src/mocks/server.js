import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(handlers.getCharacter200, handlers.getPokemon200Hateoas);
