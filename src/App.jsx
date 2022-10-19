import React, { useState, useEffect } from "react";
import { API_KEY } from "./config.json";
import sauron from "./sauron.png";
import "./App.css";

const Gender = ({ gender }) => {
  if (gender === "Female") {
    return "♀";
  } else if (gender === "Male") {
    return "⚦";
  }
  return;
};

const App = () => {
  const [people, setPeople] = useState([]);
  const [error, setError] = useState(false);
  const retrievePeople1 = () => {
    fetch("https://the-one-api.dev/v2/character", {
      headers: new Headers({
        Authorization: `Bearer ${API_KEY}`,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("fail");
        } else {
          res.json().then((data) => setPeople(data.docs));
        }
      })
      .catch((e) => {
        console.log(e);
        setError(true);
      });
  };

  useEffect(() => {
    retrievePeople1();
  }, []);
  return (
    <div className="App">
      <h1>LOTR characters</h1>
      {error ? (
        <img src={sauron} alt="sauron eye" />
      ) : people.length > 0 ? (
        <ul>
          {people.map((person) => (
            <li key={person._id}>
              <Gender gender={person.gender} />
              <a href={person.wikiUrl}>{person.name}</a>
            </li>
          ))}
        </ul>
      ) : (
        <h2>Loading</h2>
      )}
    </div>
  );
};

export default App;
