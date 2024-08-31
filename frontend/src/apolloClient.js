import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const getToken = () => localStorage.getItem('token');

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
  headers: {
    authentication: `Bearer ${getToken()}`,
  }
  
});

// WebSocket link
const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:4000/graphql',
  connectionParams: () => ({
    authentication: `Bearer ${getToken()}`,
  }),
}));

// Using split to send data to the appropriate link
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,  // Use WebSocket link for subscriptions
  httpLink // Use HTTP link for queries and mutations
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export default client;
