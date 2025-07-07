import { gql, useMutation, Reference } from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';

import LoggableEventCard from '../components/EventCards/LoggableEventCard';
import { useAuth } from '../providers/AuthProvider';
import { LoggableEvent } from '../utils/types';

// Types for mutation inputs
interface CreateLoggableEventInput {
    name: string;
    warningThresholdInDays?: number;
    labelIds?: string[];
}

interface UpdateLoggableEventInput {
    name: string;
    warningThresholdInDays?: number;
    labelIds?: string[];
}

interface AddTimestampInput {
    eventId: string;
    timestamp: string; // ISO string
}

interface RemoveTimestampInput {
    eventId: string;
    timestamp: string; // ISO string
}

// Import the existing fragment
const LOGGABLE_EVENT_FRAGMENT = LoggableEventCard.fragments.loggableEvent;

// GraphQL mutations
const CREATE_LOGGABLE_EVENT = gql`
    mutation CreateLoggableEvent($input: CreateLoggableEventInput!) {
        createLoggableEvent(input: $input) {
            id
            ...LoggableEventFragment
        }
    }
    ${LOGGABLE_EVENT_FRAGMENT}
`;

const UPDATE_LOGGABLE_EVENT = gql`
    mutation UpdateLoggableEvent($id: String!, $input: UpdateLoggableEventInput!) {
        updateLoggableEvent(id: $id, input: $input) {
            id
            ...LoggableEventFragment
        }
    }
    ${LOGGABLE_EVENT_FRAGMENT}
`;

const DELETE_LOGGABLE_EVENT = gql`
    mutation DeleteLoggableEvent($id: String!) {
        deleteLoggableEvent(id: $id) {
            id
        }
    }
`;

const ADD_TIMESTAMP_TO_EVENT = gql`
    mutation AddTimestampToEvent($eventId: String!, $timestamp: String!) {
        addTimestampToEvent(eventId: $eventId, timestamp: $timestamp) {
            id
            ...LoggableEventFragment
        }
    }
    ${LOGGABLE_EVENT_FRAGMENT}
`;

const REMOVE_TIMESTAMP_FROM_EVENT = gql`
    mutation RemoveTimestampFromEvent($eventId: String!, $timestamp: String!) {
        removeTimestampFromEvent(eventId: $eventId, timestamp: $timestamp) {
            id
            ...LoggableEventFragment
        }
    }
    ${LOGGABLE_EVENT_FRAGMENT}
`;

/**
 * Hook for managing loggable events with Apollo mutations.
 * Provides create, update, delete, and timestamp operations with optimistic updates.
 */
export const useLoggableEvents = () => {
    const { user, isOfflineMode } = useAuth();

    const [createLoggableEventMutation, { loading: createIsLoading }] = useMutation(CREATE_LOGGABLE_EVENT, {
        optimisticResponse: (variables) => ({
            createLoggableEvent: {
                __typename: 'LoggableEvent',
                id: `temp-${uuidv4()}`,
                name: variables.input.name,
                timestamps: [],
                warningThresholdInDays: variables.input.warningThresholdInDays || 0,
                createdAt: new Date().toISOString(),
                labels: []
            }
        }),
        update: (cache, { data }) => {
            if (!data?.createLoggableEvent || !user?.id) return;

            // Add new event to user's loggableEvents list
            cache.modify({
                id: cache.identify({ __typename: 'User', id: user.id }),
                fields: {
                    loggableEvents(existing = []) {
                        const newEventRef = cache.writeFragment({
                            fragment: LOGGABLE_EVENT_FRAGMENT,
                            data: data.createLoggableEvent
                        });
                        return [...existing, newEventRef];
                    }
                }
            });
        }
    });

    const [updateLoggableEventMutation, { loading: updateIsLoading }] = useMutation(UPDATE_LOGGABLE_EVENT, {
        optimisticResponse: (variables) => ({
            updateLoggableEvent: {
                __typename: 'LoggableEvent',
                id: variables.id,
                name: variables.input.name,
                timestamps: [],
                warningThresholdInDays: variables.input.warningThresholdInDays || 0,
                createdAt: new Date().toISOString(),
                labels: []
            }
        })
    });

    const [deleteLoggableEventMutation, { loading: deleteIsLoading }] = useMutation(DELETE_LOGGABLE_EVENT, {
        optimisticResponse: (variables) => ({
            deleteLoggableEvent: {
                __typename: 'LoggableEvent',
                id: variables.id
            }
        }),
        update: (cache, { data }) => {
            if (!data?.deleteLoggableEvent || !user?.id) return;

            // Remove event from user's loggableEvents list
            cache.modify({
                id: cache.identify({ __typename: 'User', id: user.id }),
                fields: {
                    loggableEvents(existing = [], { readField }) {
                        return existing.filter(
                            (eventRef: Reference) => readField('id', eventRef) !== data.deleteLoggableEvent.id
                        );
                    }
                }
            });

            // Remove the event from cache completely
            cache.evict({ id: cache.identify({ __typename: 'LoggableEvent', id: data.deleteLoggableEvent.id }) });
        }
    });

    const [addTimestampMutation, { loading: addTimestampIsLoading }] = useMutation(ADD_TIMESTAMP_TO_EVENT, {
        optimisticResponse: (variables) => ({
            addTimestampToEvent: {
                __typename: 'LoggableEvent',
                id: variables.eventId,
                // We can't easily get the current timestamps here, but Apollo will merge this
                timestamps: [variables.timestamp],
                name: '',
                warningThresholdInDays: 0,
                createdAt: new Date().toISOString(),
                labels: []
            }
        })
    });

    const [removeTimestampMutation, { loading: removeTimestampIsLoading }] = useMutation(REMOVE_TIMESTAMP_FROM_EVENT, {
        optimisticResponse: (variables) => ({
            removeTimestampFromEvent: {
                __typename: 'LoggableEvent',
                id: variables.eventId,
                // Apollo will merge the actual current state
                timestamps: [],
                name: '',
                warningThresholdInDays: 0,
                createdAt: new Date().toISOString(),
                labels: []
            }
        })
    });

    // Wrapper functions with error handling
    const createLoggableEvent = async (
        name: string,
        warningThresholdInDays?: number,
        labelIds?: string[]
    ): Promise<LoggableEvent | null> => {
        try {
            const result = await createLoggableEventMutation({
                variables: {
                    input: {
                        name,
                        warningThresholdInDays,
                        labelIds,
                        id: `temp-${uuidv4()}` // Temporary ID for offline mode
                    }
                }
            });
            return result.data?.createLoggableEvent || null;
        } catch (error) {
            if (isOfflineMode) {
                console.log('Created loggable event in demo mode');
                return null;
            }
            console.error('Error creating loggable event:', error);
            throw error;
        }
    };

    const updateLoggableEvent = async (id: string, input: UpdateLoggableEventInput): Promise<LoggableEvent | null> => {
        try {
            const result = await updateLoggableEventMutation({
                variables: { id, input }
            });
            return result.data?.updateLoggableEvent || null;
        } catch (error) {
            if (isOfflineMode) {
                console.log('Updated loggable event in demo mode');
                return null;
            }
            console.error('Error updating loggable event:', error);
            throw error;
        }
    };

    const deleteLoggableEvent = async (id: string): Promise<boolean> => {
        try {
            await deleteLoggableEventMutation({
                variables: { id }
            });
            return true;
        } catch (error) {
            if (isOfflineMode) {
                console.log('Deleted loggable event in demo mode');
                return true;
            }
            console.error('Error deleting loggable event:', error);
            throw error;
        }
    };

    const addTimestampToEvent = async (eventId: string, timestamp: Date): Promise<LoggableEvent | null> => {
        try {
            const result = await addTimestampMutation({
                variables: {
                    eventId,
                    timestamp: timestamp.toISOString()
                }
            });
            return result.data?.addTimestampToEvent || null;
        } catch (error) {
            if (isOfflineMode) {
                console.log('Added timestamp to event in demo mode');
                return null;
            }
            console.error('Error adding timestamp to event:', error);
            throw error;
        }
    };

    const removeTimestampFromEvent = async (eventId: string, timestamp: Date): Promise<LoggableEvent | null> => {
        try {
            const result = await removeTimestampMutation({
                variables: {
                    eventId,
                    timestamp: timestamp.toISOString()
                }
            });
            return result.data?.removeTimestampFromEvent || null;
        } catch (error) {
            if (isOfflineMode) {
                console.log('Removed timestamp from event in demo mode');
                return null;
            }
            console.error('Error removing timestamp from event:', error);
            throw error;
        }
    };

    return {
        createLoggableEvent,
        updateLoggableEvent,
        deleteLoggableEvent,
        addTimestampToEvent,
        removeTimestampFromEvent,
        createIsLoading,
        updateIsLoading,
        deleteIsLoading,
        addTimestampIsLoading,
        removeTimestampIsLoading,
        loading:
            createIsLoading || updateIsLoading || deleteIsLoading || addTimestampIsLoading || removeTimestampIsLoading
    };
};
