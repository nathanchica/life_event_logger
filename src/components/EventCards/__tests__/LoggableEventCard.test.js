import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockLoggableEvent } from '../../../mocks/loggableEvent';
import { createMockViewOptionsContextValue } from '../../../mocks/providers';
import { ViewOptionsContext } from '../../../providers/ViewOptionsProvider';
import LoggableEventCard from '../LoggableEventCard';

describe('LoggableEventCard', () => {
    let mockAddTimestampToEvent;
    let mockDeleteLoggableEvent;

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    beforeEach(() => {
        mockAddTimestampToEvent = jest.fn();
        mockDeleteLoggableEvent = jest.fn();
    });

    const renderWithProviders = () => {
        const viewOptionsContext = createMockViewOptionsContextValue();

        return render(
            <LocalizationProvider dateAdapter={AdapterMoment}>
                <ViewOptionsContext.Provider value={viewOptionsContext}>
                    <LoggableEventCard eventId="event-1" />
                </ViewOptionsContext.Provider>
            </LocalizationProvider>
        );
    };

    it('should display event information and labels', () => {
        renderWithProviders();

        expect(screen.getByText('Exercise')).toBeInTheDocument();
        expect(screen.getByText('Log Today')).toBeInTheDocument();
        expect(screen.getByText('Log custom date')).toBeInTheDocument();
        expect(screen.getByText('Health')).toBeInTheDocument();
        expect(screen.getByText('Personal')).toBeInTheDocument();
        expect(screen.queryByText('Work')).not.toBeInTheDocument();
        expect(screen.getByText('Records')).toBeInTheDocument();
    });

    it('should handle empty states', () => {
        renderWithProviders({
            loggableEvents: [
                createMockLoggableEvent({
                    id: 'event-1',
                    name: 'Exercise',
                    timestamps: [],
                    labelIds: []
                })
            ]
        });

        expect(screen.queryByText('Health')).not.toBeInTheDocument();
        expect(screen.queryByText('Personal')).not.toBeInTheDocument();
        expect(screen.queryByText('Records')).not.toBeInTheDocument();
    });

    it('should show limited records message for many timestamps', () => {
        const manyTimestamps = [
            new Date('2023-06-10T10:00:00Z'),
            new Date('2023-06-09T10:00:00Z'),
            new Date('2023-06-08T10:00:00Z'),
            new Date('2023-06-07T10:00:00Z'),
            new Date('2023-06-06T10:00:00Z'),
            new Date('2023-06-05T10:00:00Z'),
            new Date('2023-06-04T10:00:00Z'),
            new Date('2023-06-03T10:00:00Z'),
            new Date('2023-06-02T10:00:00Z'),
            new Date('2023-06-01T10:00:00Z')
        ];

        renderWithProviders({
            loggableEvents: [
                createMockLoggableEvent({
                    id: 'event-1',
                    timestamps: manyTimestamps
                })
            ]
        });

        expect(screen.getByText('Records (Up to 5 most recent)')).toBeInTheDocument();
    });

    it('should handle Log Today button states and interactions', () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-06-12T10:00:00Z'));

        renderWithProviders();

        const logTodayButton = screen.getByRole('button', { name: 'Log Today' });
        expect(logTodayButton).not.toBeDisabled();

        userEvent.click(logTodayButton);
        expect(mockAddTimestampToEvent).toHaveBeenCalledWith('event-1', expect.any(Date));
        expect(mockAddTimestampToEvent.mock.calls[0][1].toISOString()).toBe('2023-06-12T10:00:00.000Z');
    });

    it('should disable Log Today when already logged', () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-06-10T15:00:00Z'));

        renderWithProviders();

        expect(screen.getByRole('button', { name: 'Log Today' })).toBeDisabled();
        expect(screen.getByText('Already logged today')).toBeInTheDocument();
    });

    it('should handle edit and delete actions', () => {
        renderWithProviders();

        const optionsButton = screen.getByRole('button', { name: 'Event options for Exercise' });
        userEvent.click(optionsButton);

        const editMenuItem = screen.getByRole('menuitem', { name: 'Edit event' });
        userEvent.click(editMenuItem);

        // Check that we're in edit mode by looking for the form
        expect(screen.getByRole('form', { name: 'Edit event' })).toBeInTheDocument();
        expect(screen.getByLabelText('Event name')).toHaveValue('Exercise');
        expect(screen.queryByRole('heading', { name: 'Exercise' })).not.toBeInTheDocument();

        userEvent.click(screen.getByText('Cancel'));
        expect(screen.getByRole('heading', { name: 'Exercise' })).toBeInTheDocument();

        userEvent.click(screen.getByRole('button', { name: 'Event options for Exercise' }));
        userEvent.click(screen.getByRole('menuitem', { name: 'Delete event' }));
        expect(mockDeleteLoggableEvent).toHaveBeenCalledWith('event-1');
    });

    it.each([
        ['2023-06-10T15:00:00Z', 'Last event: Today'],
        ['2023-06-14T10:00:00Z', 'Last event: 4 days ago'],
        ['2023-06-20T10:00:00Z', 'Last event: 10 days ago']
    ])('should display last event information based on time elapsed (%s)', (dateString, expectedText) => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(dateString));
        renderWithProviders();
        expect(screen.getByText(expectedText)).toBeInTheDocument();
    });

    it('handles logging custom date', async () => {
        renderWithProviders({
            loggableEvents: [
                createMockLoggableEvent({
                    id: 'event-1',
                    name: 'Exercise',
                    timestamps: [],
                    labelIds: []
                })
            ]
        });
        expect(screen.queryByText(/Records/)).not.toBeInTheDocument();
        userEvent.click(screen.getByRole('button', { name: 'Log custom date' }));
        const dateInput = screen.getByLabelText(/event date/i);
        await userEvent.click(dateInput);
        const okButton = await screen.findByRole('button', { name: /ok/i });
        await userEvent.click(okButton);
        expect(mockAddTimestampToEvent).toHaveBeenCalledWith('event-1', expect.any(Date));
    });
});
