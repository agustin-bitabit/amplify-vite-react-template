import React from "react";
import ReactDOM from "react-dom/client";
import { Authenticator } from '@aws-amplify/ui-react';
import App from "./App.tsx";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

// Estilos por defecto de Amplify UI (se cargan primero)
import '@aws-amplify/ui-react/styles.css';

// ¡Nuestros estilos personalizados van al final para que puedan sobreescribir los de Amplify!
import "./index.css";

Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Authenticator>
      <App />
    </Authenticator>
  </React.StrictMode>
);
