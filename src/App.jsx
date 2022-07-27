import React, { useState, useEffect } from "react";
import { setScenario } from "msw-ui";
import "./App.css";

const App = () => {
  const [name, setName] = useState("");

  const retrievePeople1 = () => {
    fetch("https://swapi.dev/api/people/1").then((res) => {
      res.json().then((data) => setName(data.name));
    });
  };

  useEffect(() => {
    retrievePeople1();
  }, []);

  return (
    <div className="App">
      <h1>{name}</h1>
      <button
        onClick={() => {
          setScenario("getPeopleFr");
          retrievePeople1();
        }}
      >
        Fr version
      </button>
      <button
        onClick={() => {
          setScenario("getPeopleIt");
          retrievePeople1();
        }}
      >
        It version
      </button>
    </div>
  );
};

export default App;
