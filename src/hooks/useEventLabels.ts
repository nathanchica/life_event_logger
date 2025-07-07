import { gql, useMutation, Reference } from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';

import EventLabelComponent from '../components/EventLabels/EventLabel';
import { useAuth } from '../providers/AuthProvider';
import { EventLabel } from '../utils/types';

// Types for mutation inputs
interface CreateEventLabelInput {
    name: string;
}

interface UpdateEventLabelInput {
    name: string;
}

// Import the existing fragment
const EVENT_LABEL_FRAGMENT = EventLabelComponent.fragments.eventLabel;

// GraphQL mutations
const CREATE_EVENT_LABEL = gql`
    mutation CreateEventLabel($input: CreateEventLabelInput!) {
        createEventLabel(input: $input) {
            ...EventLabelFragment
        }
    }
    ${EVENT_LABEL_FRAGMENT}
`;

const UPDATE_EVENT_LABEL = gql`
    mutation UpdateEventLabel($id: String!, $input: UpdateEventLabelInput!) {
        updateEventLabel(id: $id, input: $input) {
            ...EventLabelFragment
        }
    }
    ${EVENT_LABEL_FRAGMENT}
`;

const DELETE_EVENT_LABEL = gql`
    mutation DeleteEventLabel($id: String!) {
        deleteEventLabel(id: $id) {
            id
        }
    }
`;

/**
 * Hook for managing event labels with Apollo mutations.
 * Provides create, update, and delete operations with optimistic updates.
 */
export const useEventLabels = () => {
    const { user, isOfflineMode } = useAuth();

    const [createEventLabelMutation, { loading: createIsLoading }] = useMutation(CREATE_EVENT_LABEL, {
        optimisticResponse: (variables) => ({
            createEventLabel: {
                __typename: 'EventLabel',
                id: `temp-${uuidv4()}`,
                name: variables.input.name,
                createdAt: new Date().toISOString()
            }
        }),
        update: (cache, { data }) => {
            if (!data?.createEventLabel || !user?.id) return;

            // Add new label to user's eventLabels list
            cache.modify({
                id: cache.identify({ __typename: 'User', id: user.id }),
                fields: {
                    eventLabels(existing = []) {
                        const newLabelRef = cache.writeFragment({
                            fragment: EVENT_LABEL_FRAGMENT,
                            data: data.createEventLabel
                        });
                        return [...existing, newLabelRef];
                    }
                }
            });
        }
    });

    const [updateEventLabelMutation, { loading: updateIsLoading }] = useMutation(UPDATE_EVENT_LABEL, {
        optimisticResponse: (variables) => ({
            updateEventLabel: {
                __typename: 'EventLabel',
                id: variables.id,
                name: variables.input.name,
                createdAt: new Date().toISOString() // This will be overwritten by cache merge
            }
        })
    });

    const [deleteEventLabelMutation, { loading: deleteIsLoading }] = useMutation(DELETE_EVENT_LABEL, {
        optimisticResponse: (variables) => ({
            deleteEventLabel: {
                __typename: 'EventLabel',
                id: variables.id
            }
        }),
        update: (cache, { data }) => {
            if (!data?.deleteEventLabel || !user?.id) return;

            // Remove label from user's eventLabels list
            cache.modify({
                id: cache.identify({ __typename: 'User', id: user.id }),
                fields: {
                    eventLabels(existing = [], { readField }) {
                        return existing.filter(
                            (labelRef: Reference) => readField('id', labelRef) !== data.deleteEventLabel.id
                        );
                    }
                }
            });

            // Remove the label from cache completely
            cache.evict({ id: cache.identify({ __typename: 'EventLabel', id: data.deleteEventLabel.id }) });
        }
    });

    // Wrapper functions with error handling
    const createEventLabel = async (input: CreateEventLabelInput): Promise<EventLabel | null> => {
        try {
            const result = await createEventLabelMutation({
                variables: {
                    input: {
                        ...input,
                        id: `temp-${uuidv4()}` // Temporary ID for offline mode
                    }
                }
            });
            return result.data?.createEventLabel || null;
        } catch (error) {
            // In offline mode (demo mode), mutation will fail but optimistic update remains
            if (isOfflineMode) {
                console.log('Created event label in demo mode');
                return null;
            }
            console.error('Error creating event label:', error);
            throw error;
        }
    };

    const updateEventLabel = async (id: string, input: UpdateEventLabelInput): Promise<EventLabel | null> => {
        try {
            const result = await updateEventLabelMutation({
                variables: { id, input }
            });
            return result.data?.updateEventLabel || null;
        } catch (error) {
            if (isOfflineMode) {
                console.log('Updated event label in demo mode');
                return null;
            }
            console.error('Error updating event label:', error);
            throw error;
        }
    };

    const deleteEventLabel = async (id: string): Promise<boolean> => {
        try {
            await deleteEventLabelMutation({
                variables: { id }
            });
            return true;
        } catch (error) {
            if (isOfflineMode) {
                console.log('Deleted event label in demo mode');
                return true;
            }
            console.error('Error deleting event label:', error);
            throw error;
        }
    };

    return {
        createEventLabel,
        updateEventLabel,
        deleteEventLabel,
        createIsLoading,
        updateIsLoading,
        deleteIsLoading,
        loading: createIsLoading || updateIsLoading || deleteIsLoading
    };
};
