import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { MemoryRouter } from "react-router-dom";
import { LOTR } from "../LOTR";
import { server } from "../../../mocks/server";
import { handlers } from "../../../mocks/handlers";

// Tests
describe("Renders main page correctly", async () => {
  it("Should render the page correctly", async () => {
    server.use(
      http.get("https://the-one-api.dev/v2/character", async () => {
        await delay(1000);
        return HttpResponse.json(getCharacter, { status: 200 });
      })
    );
    render(<LOTR />);
    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(await screen.findByText("Amrod")).toBeInTheDocument();
  });
});
