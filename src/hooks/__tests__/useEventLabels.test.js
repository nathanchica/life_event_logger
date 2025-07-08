import { InMemoryCache, gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { renderHook, act } from '@testing-library/react';

import { createMockAuthContextValue } from '../../mocks/providers';
import { createMockUser } from '../../mocks/user';
import { AuthContext } from '../../providers/AuthProvider';
import {
    useEventLabels,
    CREATE_EVENT_LABEL_MUTATION,
    UPDATE_EVENT_LABEL_MUTATION,
    DELETE_EVENT_LABEL_MUTATION
} from '../useEventLabels';

// Mock uuid to return a predictable value
jest.mock('uuid', () => ({
    v4: () => 'mocked-uuid-value'
}));

const mockCreatedAt = '2023-01-01T00:00:00Z';

const createCreateEventLabelMutation = ({
    id,
    serverGeneratedId,
    name,
    apiErrors = [],
    gqlError = null,
    customPayload = undefined,
    delay = 0
}) => {
    return {
        request: {
            query: CREATE_EVENT_LABEL_MUTATION,
            variables: {
                input: {
                    name,
                    id
                }
            }
        },
        ...(delay > 0 ? { delay } : {}),
        ...(gqlError
            ? {
                  error: gqlError
              }
            : {
                  result: {
                      data: {
                          createEventLabel:
                              customPayload !== undefined
                                  ? customPayload
                                  : {
                                        __typename: 'CreateEventLabelPayload',
                                        eventLabel: {
                                            __typename: 'EventLabel',
                                            id: serverGeneratedId,
                                            name,
                                            createdAt: mockCreatedAt
                                        },
                                        errors: apiErrors
                                    }
                      }
                  }
              })
    };
};

const createUpdateEventLabelMutation = ({
    id,
    name,
    apiErrors = [],
    gqlError = null,
    customPayload = undefined,
    delay = 0
}) => {
    return {
        request: {
            query: UPDATE_EVENT_LABEL_MUTATION,
            variables: {
                input: {
                    id,
                    name
                }
            }
        },
        ...(delay > 0 ? { delay } : {}),
        ...(gqlError
            ? {
                  error: gqlError
              }
            : {
                  result: {
                      data: {
                          updateEventLabel:
                              customPayload !== undefined
                                  ? customPayload
                                  : {
                                        __typename: 'UpdateEventLabelPayload',
                                        eventLabel: {
                                            __typename: 'EventLabel',
                                            id,
                                            name,
                                            createdAt: mockCreatedAt
                                        },
                                        errors: apiErrors
                                    }
                      }
                  }
              })
    };
};

const createDeleteEventLabelMutation = ({
    id,
    apiErrors = [],
    gqlError = null,
    customPayload = undefined,
    delay = 0
}) => {
    return {
        request: {
            query: DELETE_EVENT_LABEL_MUTATION,
            variables: {
                input: {
                    id
                }
            }
        },
        ...(delay > 0 ? { delay } : {}),
        ...(gqlError
            ? {
                  error: gqlError
              }
            : {
                  result: {
                      data: {
                          deleteEventLabel:
                              customPayload !== undefined
                                  ? customPayload
                                  : {
                                        __typename: 'DeleteEventLabelPayload',
                                        eventLabel: {
                                            __typename: 'EventLabel',
                                            id
                                        },
                                        errors: apiErrors
                                    }
                      }
                  }
              })
    };
};

describe('useEventLabels', () => {
    let mockUser;
    let mockAuthContextValue;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUser = createMockUser();
        mockAuthContextValue = createMockAuthContextValue({ user: mockUser });
    });

    const renderHookWithProviders = (mocks = []) => {
        const wrapper = ({ children }) => (
            <MockedProvider
                mocks={mocks}
                defaultOptions={{ watchQuery: { errorPolicy: 'all' } }}
                cache={new InMemoryCache()}
            >
                <AuthContext.Provider value={mockAuthContextValue}>{children}</AuthContext.Provider>
            </MockedProvider>
        );

        return renderHook(() => useEventLabels(), { wrapper });
    };

    describe('hook initialization', () => {
        it('returns all expected functions and loading states', () => {
            const { result } = renderHookWithProviders();

            expect(result.current.createEventLabel).toBeInstanceOf(Function);
            expect(result.current.updateEventLabel).toBeInstanceOf(Function);
            expect(result.current.deleteEventLabel).toBeInstanceOf(Function);
            expect(typeof result.current.createIsLoading).toBe('boolean');
            expect(typeof result.current.updateIsLoading).toBe('boolean');
            expect(typeof result.current.deleteIsLoading).toBe('boolean');
            expect(typeof result.current.loading).toBe('boolean');
        });

        it('initializes with loading states as false', () => {
            const { result } = renderHookWithProviders();

            expect(result.current.createIsLoading).toBe(false);
            expect(result.current.updateIsLoading).toBe(false);
            expect(result.current.deleteIsLoading).toBe(false);
            expect(result.current.loading).toBe(false);
        });
    });

    describe('createEventLabel', () => {
        it('creates event label successfully', async () => {
            const mocks = [
                createCreateEventLabelMutation({
                    id: 'temp-mocked-uuid-value',
                    serverGeneratedId: 'new-label-id',
                    name: 'New Label'
                })
            ];

            const { result } = renderHookWithProviders(mocks);

            let payload;
            await act(async () => {
                payload = await result.current.createEventLabel({ name: 'New Label' });
            });

            expect(payload).toEqual(
                expect.objectContaining({
                    eventLabel: {
                        __typename: 'EventLabel',
                        id: 'new-label-id',
                        name: 'New Label',
                        createdAt: mockCreatedAt
                    },
                    errors: []
                })
            );
        });

        it('handles gql errors gracefully and returns null', async () => {
            const mocks = [
                createCreateEventLabelMutation({
                    id: 'temp-mocked-uuid-value',
                    name: 'New Label',
                    gqlError: new Error('Network error')
                })
            ];

            const { result } = renderHookWithProviders(mocks);

            let payload;
            await act(async () => {
                payload = await result.current.createEventLabel({ name: 'New Label' });
            });

            expect(payload).toBeNull();
        });

        it('returns null when mutation result is empty', async () => {
            const mocks = [
                createCreateEventLabelMutation({
                    id: 'temp-mocked-uuid-value',
                    name: 'New Label',
                    customPayload: null
                })
            ];

            const { result } = renderHookWithProviders(mocks);

            let payload;
            await act(async () => {
                payload = await result.current.createEventLabel({ name: 'New Label' });
            });

            expect(payload).toBeNull();
        });
    });

    describe('updateEventLabel', () => {
        it('updates event label successfully', async () => {
            const mocks = [
                createUpdateEventLabelMutation({
                    id: 'existing-label-id',
                    name: 'Updated Label'
                })
            ];

            const { result } = renderHookWithProviders(mocks);

            let payload;
            await act(async () => {
                payload = await result.current.updateEventLabel({ id: 'existing-label-id', name: 'Updated Label' });
            });

            expect(payload).toEqual(
                expect.objectContaining({
                    eventLabel: {
                        __typename: 'EventLabel',
                        id: 'existing-label-id',
                        name: 'Updated Label',
                        createdAt: mockCreatedAt
                    },
                    errors: []
                })
            );
        });

        it('handles gql errors gracefully and returns null', async () => {
            const mocks = [
                createUpdateEventLabelMutation({
                    id: 'existing-label-id',
                    name: 'Updated Label',
                    gqlError: new Error('Network error')
                })
            ];

            const { result } = renderHookWithProviders(mocks);

            let payload;
            await act(async () => {
                payload = await result.current.updateEventLabel({ id: 'existing-label-id', name: 'Updated Label' });
            });

            expect(payload).toBeNull();
        });

        it('returns null when mutation result is empty', async () => {
            const mocks = [
                createUpdateEventLabelMutation({
                    id: 'existing-label-id',
                    name: 'Updated Label',
                    customPayload: null
                })
            ];

            const { result } = renderHookWithProviders(mocks);

            let payload;
            await act(async () => {
                payload = await result.current.updateEventLabel({ id: 'existing-label-id', name: 'Updated Label' });
            });

            expect(payload).toBeNull();
        });
    });

    describe('deleteEventLabel', () => {
        it('deletes event label successfully', async () => {
            const mocks = [
                createDeleteEventLabelMutation({
                    id: 'label-to-delete'
                })
            ];

            const { result } = renderHookWithProviders(mocks);

            let payload;
            await act(async () => {
                payload = await result.current.deleteEventLabel({ id: 'label-to-delete' });
            });

            expect(payload).toEqual(
                expect.objectContaining({
                    eventLabel: {
                        __typename: 'EventLabel',
                        id: 'label-to-delete'
                    },
                    errors: []
                })
            );
        });

        it('handles gql errors gracefully and returns null', async () => {
            const mocks = [
                createDeleteEventLabelMutation({
                    id: 'label-to-delete',
                    gqlError: new Error('Network error')
                })
            ];

            const { result } = renderHookWithProviders(mocks);

            let payload;
            await act(async () => {
                payload = await result.current.deleteEventLabel({ id: 'label-to-delete' });
            });

            expect(payload).toBeNull();
        });

        it('returns null when mutation result is empty', async () => {
            const mocks = [
                createDeleteEventLabelMutation({
                    id: 'label-to-delete',
                    customPayload: null
                })
            ];

            const { result } = renderHookWithProviders(mocks);

            let payload;
            await act(async () => {
                payload = await result.current.deleteEventLabel({ id: 'label-to-delete' });
            });

            expect(payload).toBeNull();
        });
    });

    describe('loading states', () => {
        it('shows loading state during create operation', async () => {
            const mocks = [
                createCreateEventLabelMutation({
                    id: 'temp-mocked-uuid-value',
                    serverGeneratedId: 'new-label-id',
                    name: 'New Label',
                    delay: 100
                })
            ];

            const { result } = renderHookWithProviders(mocks);

            act(() => {
                result.current.createEventLabel({ name: 'New Label' });
            });

            expect(result.current.createIsLoading).toBe(true);
            expect(result.current.loading).toBe(true);
        });

        it('shows loading state during update operation', async () => {
            const mocks = [
                createUpdateEventLabelMutation({
                    id: 'existing-label-id',
                    name: 'Updated Label',
                    delay: 100
                })
            ];

            const { result } = renderHookWithProviders(mocks);

            act(() => {
                result.current.updateEventLabel({ id: 'existing-label-id', name: 'Updated Label' });
            });

            expect(result.current.updateIsLoading).toBe(true);
            expect(result.current.loading).toBe(true);
        });

        it('shows loading state during delete operation', async () => {
            const mocks = [
                createDeleteEventLabelMutation({
                    id: 'label-to-delete',
                    delay: 100
                })
            ];

            const { result } = renderHookWithProviders(mocks);

            act(() => {
                result.current.deleteEventLabel({ id: 'label-to-delete' });
            });

            expect(result.current.deleteIsLoading).toBe(true);
            expect(result.current.loading).toBe(true);
        });
    });

    describe('cache guard conditions', () => {
        it('handles cache update when user is null for create operation', async () => {
            // Test the case where user.id is undefined - should trigger early return in cache update
            const mockAuthContextWithoutUser = createMockAuthContextValue({ user: null });

            const mocks = [
                createCreateEventLabelMutation({
                    id: 'temp-mocked-uuid-value',
                    serverGeneratedId: 'new-label-id',
                    name: 'New Label'
                })
            ];

            // Create hook instance with different auth context
            const { result: resultWithoutUser } = renderHook(() => useEventLabels(), {
                wrapper: ({ children }) => (
                    <MockedProvider mocks={mocks}>
                        <AuthContext.Provider value={mockAuthContextWithoutUser}>{children}</AuthContext.Provider>
                    </MockedProvider>
                )
            });

            let payload;
            await act(async () => {
                payload = await resultWithoutUser.current.createEventLabel({ name: 'New Label' });
            });

            expect(payload).toEqual(
                expect.objectContaining({
                    eventLabel: {
                        __typename: 'EventLabel',
                        id: 'new-label-id',
                        name: 'New Label',
                        createdAt: mockCreatedAt
                    },
                    errors: []
                })
            );
        });

        it('handles cache update when user is null for delete operation', async () => {
            // Test the case where user.id is undefined - should trigger early return in cache update
            const mockAuthContextWithoutUser = createMockAuthContextValue({ user: null });

            const mocks = [
                createDeleteEventLabelMutation({
                    id: 'label-to-delete'
                })
            ];

            const { result } = renderHook(() => useEventLabels(), {
                wrapper: ({ children }) => (
                    <MockedProvider mocks={mocks}>
                        <AuthContext.Provider value={mockAuthContextWithoutUser}>{children}</AuthContext.Provider>
                    </MockedProvider>
                )
            });

            let payload;
            await act(async () => {
                payload = await result.current.deleteEventLabel({ id: 'label-to-delete' });
            });

            expect(payload).toEqual(
                expect.objectContaining({
                    eventLabel: {
                        __typename: 'EventLabel',
                        id: 'label-to-delete'
                    },
                    errors: []
                })
            );
        });
    });

    describe('cache update execution', () => {
        it('executes cache update logic for successful create operation', async () => {
            const cache = new InMemoryCache();

            // Pre-populate cache with user data
            cache.writeQuery({
                query: gql`
                    query GetUser($id: String!) {
                        user(id: $id) {
                            id
                            eventLabels {
                                id
                                name
                                createdAt
                            }
                        }
                    }
                `,
                variables: { id: mockUser.id },
                data: {
                    user: {
                        __typename: 'User',
                        id: mockUser.id,
                        eventLabels: [
                            {
                                __typename: 'EventLabel',
                                id: 'existing-label',
                                name: 'Existing Label',
                                createdAt: '2023-01-01T00:00:00Z'
                            }
                        ]
                    }
                }
            });

            const mocks = [
                createCreateEventLabelMutation({
                    id: 'temp-mocked-uuid-value',
                    serverGeneratedId: 'new-label-id',
                    name: 'New Label'
                })
            ];

            const { result } = renderHook(() => useEventLabels(), {
                wrapper: ({ children }) => (
                    <MockedProvider mocks={mocks} cache={cache}>
                        <AuthContext.Provider value={mockAuthContextValue}>{children}</AuthContext.Provider>
                    </MockedProvider>
                )
            });

            let payload;
            await act(async () => {
                payload = await result.current.createEventLabel({ name: 'New Label' });
            });

            // Should successfully create the label
            expect(payload).toEqual(
                expect.objectContaining({
                    eventLabel: {
                        __typename: 'EventLabel',
                        id: 'new-label-id',
                        name: 'New Label',
                        createdAt: mockCreatedAt
                    },
                    errors: []
                })
            );

            // Check that cache was updated by reading from it
            const cachedData = cache.readQuery({
                query: gql`
                    query GetUser($id: String!) {
                        user(id: $id) {
                            id
                            eventLabels {
                                id
                                name
                                createdAt
                            }
                        }
                    }
                `,
                variables: { id: mockUser.id }
            });

            // The new label should be added to the cache
            expect(cachedData?.user?.eventLabels).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: 'new-label-id',
                        name: 'New Label'
                    })
                ])
            );
        });

        it('executes cache update logic for successful delete operation', async () => {
            const cache = new InMemoryCache();

            // Pre-populate cache with user data including labels to delete
            cache.writeQuery({
                query: gql`
                    query GetUser($id: String!) {
                        user(id: $id) {
                            id
                            eventLabels {
                                id
                                name
                                createdAt
                            }
                        }
                    }
                `,
                variables: { id: mockUser.id },
                data: {
                    user: {
                        __typename: 'User',
                        id: mockUser.id,
                        eventLabels: [
                            {
                                __typename: 'EventLabel',
                                id: 'label-to-delete',
                                name: 'Label to Delete',
                                createdAt: '2023-01-01T00:00:00Z'
                            },
                            {
                                __typename: 'EventLabel',
                                id: 'label-to-keep',
                                name: 'Label to Keep',
                                createdAt: '2023-01-01T00:00:00Z'
                            }
                        ]
                    }
                }
            });

            const mocks = [
                createDeleteEventLabelMutation({
                    id: 'label-to-delete'
                })
            ];

            const { result } = renderHook(() => useEventLabels(), {
                wrapper: ({ children }) => (
                    <MockedProvider mocks={mocks} cache={cache}>
                        <AuthContext.Provider value={mockAuthContextValue}>{children}</AuthContext.Provider>
                    </MockedProvider>
                )
            });

            let payload;
            await act(async () => {
                payload = await result.current.deleteEventLabel({ id: 'label-to-delete' });
            });

            // Should successfully delete the label
            expect(payload).toEqual(
                expect.objectContaining({
                    eventLabel: {
                        __typename: 'EventLabel',
                        id: 'label-to-delete'
                    },
                    errors: []
                })
            );

            // Check that cache was updated by reading from it
            const cachedData = cache.readQuery({
                query: gql`
                    query GetUser($id: String!) {
                        user(id: $id) {
                            id
                            eventLabels {
                                id
                                name
                                createdAt
                            }
                        }
                    }
                `,
                variables: { id: mockUser.id }
            });

            // The deleted label should be removed from the cache
            expect(cachedData?.user?.eventLabels).toEqual([
                expect.objectContaining({
                    id: 'label-to-keep',
                    name: 'Label to Keep'
                })
            ]);

            // Ensure the deleted label is not in the cache
            expect(cachedData?.user?.eventLabels).not.toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: 'label-to-delete'
                    })
                ])
            );
        });
    });
});
