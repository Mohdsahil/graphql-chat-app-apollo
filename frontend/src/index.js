import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ApolloProvider } from '@apollo/client'

import client from './apolloClient';

// const socket = new WebSocket('ws://localhost:4000/graphql');
// socket.onopen = () => {
//   console.log('Connected');
// };
// socket.onerror = (error) => {
//   console.error('WebSocket error:', error);
// };

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ApolloProvider client={client}>
  <App />
</ApolloProvider>
);


