import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

/**
 * Este é o ficheiro de entrada do seu aplicativo.
 * Ele seleciona o elemento 'root' no seu app.html e renderiza
 * o componente principal <App /> dentro dele.
 */

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
