import { render, screen } from '@testing-library/react';

import { createMockLoggableEvent } from '../../mocks/loggableEvent';
import { createMockLoggableEventsContextValue, createMockViewOptionsContextValue } from '../../mocks/providers';
import { LoggableEventsContext } from '../../providers/LoggableEventsProvider';
import { ViewOptionsContext } from '../../providers/ViewOptionsProvider';
import LoggableEventsList from '../LoggableEventsList';

// Mock child components to focus on LoggableEventsList logic
jest.mock('../EventCards/LoggableEventCard', () => {
    return function MockLoggableEventCard({ eventId }) {
        return <div data-testid={`event-card-${eventId}`}>Event Card {eventId}</div>;
    };
});

jest.mock('../EventCards/EventCard', () => ({
    EventCardSkeleton: function MockEventCardSkeleton() {
        return <div data-testid="event-card-shimmer">Loading...</div>;
    }
}));

describe('LoggableEventsList', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderWithProviders = (component, { eventsValue, viewOptionsValue } = {}) => {
        const defaultEventsValue = createMockLoggableEventsContextValue();
        const defaultViewOptionsValue = createMockViewOptionsContextValue();

        return render(
            <LoggableEventsContext.Provider value={eventsValue || defaultEventsValue}>
                <ViewOptionsContext.Provider value={viewOptionsValue || defaultViewOptionsValue}>
                    {component}
                </ViewOptionsContext.Provider>
            </LoggableEventsContext.Provider>
        );
    };

    describe('Loading state', () => {
        it.each([
            ['shows skeletons when loading', false, false, 3],
            ['shows no skeletons in offline mode', false, true, 0],
            ['shows no skeletons when data loaded', true, false, 0]
        ])('%s', (_, dataIsLoaded, offlineMode, expectedSkeletons) => {
            const eventsValue = createMockLoggableEventsContextValue({
                dataIsLoaded,
                loggableEvents: []
            });

            renderWithProviders(<LoggableEventsList offlineMode={offlineMode} />, { eventsValue });

            const skeletons = screen.queryAllByTestId('event-card-shimmer');
            expect(skeletons).toHaveLength(expectedSkeletons);

            const listItems = screen.queryAllByRole('listitem');
            expect(listItems).toHaveLength(expectedSkeletons);
        });
    });

    describe('Rendering events', () => {
        it.each([
            ['no events', []],
            ['single event', [createMockLoggableEvent({ id: 'event-1', name: 'Single Event' })]],
            [
                'multiple events',
                [
                    createMockLoggableEvent({ id: 'event-1', name: 'First Event' }),
                    createMockLoggableEvent({ id: 'event-2', name: 'Second Event' }),
                    createMockLoggableEvent({ id: 'event-3', name: 'Third Event' })
                ]
            ]
        ])('renders %s correctly', (_, events) => {
            const eventsValue = createMockLoggableEventsContextValue({
                dataIsLoaded: true,
                loggableEvents: events
            });

            renderWithProviders(<LoggableEventsList />, { eventsValue });

            const listItems = screen.queryAllByRole('listitem');
            expect(listItems).toHaveLength(events.length);

            events.forEach((event) => {
                expect(screen.getByTestId(`event-card-${event.id}`)).toBeInTheDocument();
            });
        });
    });

    describe('Label filtering', () => {
        const labelId1 = 'label-1';
        const labelId2 = 'label-2';

        const mockEvents = [
            createMockLoggableEvent({
                id: 'event-1',
                name: 'Event with Label 1',
                labelIds: [labelId1]
            }),
            createMockLoggableEvent({
                id: 'event-2',
                name: 'Event with Label 2',
                labelIds: [labelId2]
            }),
            createMockLoggableEvent({
                id: 'event-3',
                name: 'Event with both labels',
                labelIds: [labelId1, labelId2]
            }),
            createMockLoggableEvent({
                id: 'event-4',
                name: 'Event with no labels',
                labelIds: []
            }),
            createMockLoggableEvent({
                id: 'event-5',
                name: 'Event with null labels',
                labelIds: null
            })
        ];

        it.each([
            ['null', null, 5],
            ['undefined', undefined, 5],
            ['empty string', '', 5],
            ['non-existent label', 'non-existent-label', 0],
            ['label-1', labelId1, 2],
            ['label-2', labelId2, 2]
        ])('filters correctly with %s activeEventLabelId', (_, activeEventLabelId, expectedCount) => {
            const eventsValue = createMockLoggableEventsContextValue({
                dataIsLoaded: true,
                loggableEvents: mockEvents
            });

            const viewOptionsValue = createMockViewOptionsContextValue({
                activeEventLabelId
            });

            renderWithProviders(<LoggableEventsList />, { eventsValue, viewOptionsValue });

            const listItems = screen.queryAllByRole('listitem');
            expect(listItems).toHaveLength(expectedCount);
        });
    });

    describe('Offline mode', () => {
        it.each([
            [
                'renders events when offline and not loaded',
                true,
                false,
                [createMockLoggableEvent({ id: 'event-1', name: 'Offline Event' })],
                0
            ],
            ['shows skeletons when not offline and not loaded', false, false, [], 3],
            ['shows skeletons with undefined offline mode', undefined, false, [], 3]
        ])('%s', (_, offlineMode, dataIsLoaded, loggableEvents, expectedSkeletons) => {
            const eventsValue = createMockLoggableEventsContextValue({
                dataIsLoaded,
                loggableEvents
            });

            renderWithProviders(<LoggableEventsList offlineMode={offlineMode} />, { eventsValue });

            const skeletons = screen.queryAllByTestId('event-card-shimmer');
            expect(skeletons).toHaveLength(expectedSkeletons);

            const listItems = screen.queryAllByRole('listitem');
            expect(listItems).toHaveLength(expectedSkeletons + loggableEvents.length);

            loggableEvents.forEach((event) => {
                expect(screen.getByTestId(`event-card-${event.id}`)).toBeInTheDocument();
            });
        });
    });
});
