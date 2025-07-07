import { ApolloClient, ApolloLink, Observable, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { OperationDefinitionNode } from 'graphql';

import { cache, setupCachePersistence } from './cache';

/**
 * Mock Apollo Link for offline development and testing.
 *
 * This link intercepts GraphQL operations and provides simulated responses for:
 * - Offline functionality testing
 * - Development without server dependencies
 * - Unit and integration testing
 * - Demonstrations and prototyping
 *
 * What it does:
 * - Intercepts mutation operations (CREATE, UPDATE, DELETE)
 * - Returns mock successful responses with realistic data structure
 * - Provides immediate responses for instant feedback
 * - Passes queries through to cache (enabling offline data access)
 * - Enables testing of optimistic UI patterns
 *
 * Used when the app is in offline mode or when running tests.
 */
const offlineMockLink = new ApolloLink((operation, forward) => {
    const definition = operation.query.definitions[0] as OperationDefinitionNode;

    // Handle mutations with mock responses
    if (definition.operation === 'mutation') {
        return new Observable((observer) => {
            const { operationName, variables } = operation;

            // Mock CreateLoggableEvent mutation response
            if (operationName === 'CreateLoggableEvent') {
                observer.next({
                    data: {
                        createLoggableEvent: {
                            __typename: 'LoggableEvent',
                            id: variables.input?.id || `server-${Date.now()}`, // Generate server-like ID
                            ...variables.input,
                            createdAt: new Date().toISOString(),
                            labels: [] // Empty labels array for new events
                        }
                    }
                });
            }
            // Mock UpdateLoggableEvent mutation response
            else if (operationName === 'UpdateLoggableEvent') {
                observer.next({
                    data: {
                        updateLoggableEvent: {
                            __typename: 'LoggableEvent',
                            id: variables.id,
                            ...variables.input,
                            labels: [] // Simplified - would normally preserve existing labels
                        }
                    }
                });
            }
            // Mock CreateEventLabel mutation response
            else if (operationName === 'CreateEventLabel') {
                observer.next({
                    data: {
                        createEventLabel: {
                            __typename: 'EventLabel',
                            id: variables.input?.id || `server-${Date.now()}`,
                            ...variables.input,
                            createdAt: new Date().toISOString()
                        }
                    }
                });
            }
            // Mock UpdateEventLabel mutation response
            else if (operationName === 'UpdateEventLabel') {
                observer.next({
                    data: {
                        updateEventLabel: {
                            __typename: 'EventLabel',
                            id: variables.id,
                            ...variables.input
                        }
                    }
                });
            }

            observer.complete();
        });
    }

    // For queries, pass through to next link in chain (eventually hits cache)
    // This enables reading cached data when offline
    return forward ? forward(operation) : Observable.of();
});

// HTTP link for production use, connecting to the GraphQL server
const httpLink = createHttpLink({
    uri: process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:4000',
    credentials: 'include'
});

// Auth link to add authorization token to requests
const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : ''
        }
    };
});

/**
 * Creates and configures the Apollo Client instance.
 *
 * Sets up:
 * - Cache persistence for offline support
 * - Appropriate link based on mode (mock for offline, HTTP for online)
 * - Optimized fetch policies for offline-first experience
 *
 * @param isOfflineMode - Whether to use mock responses instead of real server
 * @returns Configured Apollo Client instance
 */
export const createApolloClient = async (isOfflineMode = false) => {
    // Setup cache persistence to localStorage for offline support
    await setupCachePersistence();

    return new ApolloClient({
        // Use mock link in offline mode, authenticated HTTP link when online
        link: isOfflineMode ? offlineMockLink : authLink.concat(httpLink),
        cache,
        defaultOptions: {
            watchQuery: {
                // For subscriptions: check cache first, then network, show both
                fetchPolicy: 'cache-and-network',
                errorPolicy: 'all' // Don't fail on network errors, show partial data
            },
            query: {
                // For one-time queries: prefer cache for fast offline experience
                fetchPolicy: 'cache-first',
                errorPolicy: 'all' // Don't fail on network errors, show cached data
            }
        }
    });
};
