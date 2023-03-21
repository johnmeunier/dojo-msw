import React from 'react';
import "./App.css";

import { createBrowserRouter, RouterProvider, Link } from "react-router-dom";

import { LOTR } from './Pages/LOTR';
import { Pokemon } from './Pages/Pokemon';

const router = createBrowserRouter([
  {
    path: "/lotr",
    element: <LOTR />,
    errorElement: <Error />,
  },
  {
    path: "/pokemon",
    element: <Pokemon />,
    errorElement: <Error />,
  },
]);

const App = () => {
  return <RouterProvider router={router} />

};

export default App;
