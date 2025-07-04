import { GET_LOGGABLE_EVENTS_FOR_USER } from '../components/LoggableEventsGQL';
import { createMockUser } from './user';
import { createMockLoggableEventFragment } from './loggableEvent';
import { LoggableEventFragment } from '../utils/types';

export const createGetLoggableEventsForUserMock = (
    userId: string = createMockUser().id,
    loggableEvents: Array<LoggableEventFragment> = [
        createMockLoggableEventFragment(),
        createMockLoggableEventFragment({ id: 'event-2', name: 'Test Event 2' })
    ]
) => {
    return {
        request: {
            query: GET_LOGGABLE_EVENTS_FOR_USER,
            variables: { userId }
        },
        result: {
            data: {
                user: {
                    loggableEvents
                }
            }
        }
    };
};

export const createGetLoggableEventsForUserErrorMock = (userId: string = createMockUser().id) => ({
    request: {
        query: GET_LOGGABLE_EVENTS_FOR_USER,
        variables: { userId }
    },
    error: new Error('GraphQL Error: Unable to fetch loggable events')
});
