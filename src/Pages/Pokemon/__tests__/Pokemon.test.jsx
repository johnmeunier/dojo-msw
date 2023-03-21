import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import {
  MemoryRouter 
} from "react-router-dom";
import userEvent from '@testing-library/user-event'; 
import { Pokemon } from '../Pokemon';

test('je vérifie que le premier pokemon', async () => {
  render(<MemoryRouter initialEntries={["/pokemon?limit=10"]}><Pokemon /></MemoryRouter>);
  const $bulbasaur = await screen.findByText(/bulbasaura/);
  expect($bulbasaur).toBeInTheDocument();
});

test('display the 11th pokemon', async () => {
  render(<MemoryRouter initialEntries={["/pokemon?limit=10"]}><Pokemon /></MemoryRouter>);
  const $button = await screen.findByRole('button', {name : "Next"});
  fireEvent.click($button);
  await waitFor(() => {
    // const $pokemons = screen.getAllByRole('listitem');
    // expect(within($pokemons[0]).getByText(/metapod/)).toBeInTheDocument();
    const $firstPokemon = screen.getByTestId('pokemon-0');
    expect(within($firstPokemon).getByText(/metapod/)).toBeInTheDocument();
  })
})
