import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export const Pokemon = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [limit, setLimit] = useState(searchParams.get("limit"));
  const [urlToFech, setUrlToFetch] = useState(`https://pokeapi.co/api/v2/pokemon/?offset=0&limit=${limit}`);
  const [previousUrl, setPreviousUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [maxPokemons, setMaxPokemons] = useState(null);
  const [pokemons, setPokemons] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearchParams({ limit });
    fetch(urlToFech)
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error(res.status);
        }
      })
      .then((data) => {
        setPokemons(
          data.results.map((pokemon, index) => ({
            ...pokemon,
            id: index + 1,
          }))
        );
        setNextUrl(data.next);
        setPreviousUrl(data.previous);
        setMaxPokemons(data.count);
      })
      .catch((e) => {
        console.log("toto");
        console.log(e);
      });
  }, [limit, urlToFech]);

  return (
    <>
      {limit === maxPokemons && (
        <>
          <label htmlFor="search">Search</label>
          <input type="text" id="search" name="search" onChange={({ target: { value } }) => setSearch(value)} />
        </>
      )}
      <label htmlFor="search">Limit</label>
      <select
        onChange={(e) => {
          setLimit(e.target.value);
          setUrlToFetch(`https://pokeapi.co/api/v2/pokemon/?offset=0&limit=${e.target.value}`);
        }}
        value={limit}
      >
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="50">50</option>
        <option value="100">100</option>
        <option value={maxPokemons}>Tous</option>
      </select>
      {previousUrl && <button onClick={() => setUrlToFetch(previousUrl)}>Previous</button>}
      {nextUrl && <button onClick={() => setUrlToFetch(nextUrl)}>Next</button>}

      <ul>
        {pokemons.length > 0 ? (
          pokemons
            .filter(({ name }) => name.includes(search))
            .map(({ name, id }, index) => <li key={name} data-testid={`pokemon-${index}`}>{name}</li>)
        ) : (
          <h2>Chargement en cours ...</h2>
        )}
      </ul>
    </>
  );
};
