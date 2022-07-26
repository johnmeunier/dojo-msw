import React, { useState, useEffect } from "react";
import "./App.css";

const App = () => {
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("https://swapi.dev/api/people/1").then((res) => {
      res.json().then((data) => setName(data.name));
    });
  }, []);

  return (
    <div className="App">
      <h1>{name}</h1>
    </div>
  );
};

export default App;
