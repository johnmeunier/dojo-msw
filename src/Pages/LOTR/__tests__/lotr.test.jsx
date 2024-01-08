import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LOTR } from "../LOTR";
import { server } from "../../../mocks/server";
import { handlers } from "../../../mocks/handlers";

// Tests
describe("Renders main page correctly", async () => {
  it("Should render the page correctly", async () => {
    server.use(handlers.getCharacter200);
    render(
      <MemoryRouter initialEntries={["/lotr"]}>
        <LOTR />
      </MemoryRouter>
    );
    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(await screen.findByText("Amandil")).toBeInTheDocument();
  });
});
