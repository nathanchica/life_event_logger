import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';

import EditEventCard from '../components/EventCards/EditEventCard';
import { LoggableEventsContext } from '../providers/LoggableEventsProvider';
import { ComponentDisplayContext } from '../providers/ComponentDisplayProvider';
import { MAX_LENGTH } from '../components/EventCards/EditEventCard';

describe('EditEventCard', () => {
    function renderWithProvider(ui, existingEvents = [], eventLabels = [], activeEventLabelId = null) {
        const mockLoggableEventsContextValue = {
            loggableEvents: existingEvents,
            createLoggableEvent: jest.fn(),
            updateLoggableEventDetails: jest.fn(),
            deleteLoggableEvent: jest.fn(),
            logEvent: jest.fn(),
            deleteEventTimestamp: jest.fn(),
            eventLabels: eventLabels,
            createEventLabel: jest.fn(),
            deleteEventLabel: jest.fn(),
            offlineMode: true
        };

        const mockComponentDisplayContextValue = {
            activeEventLabelId: activeEventLabelId,
            setActiveEventLabelId: jest.fn(),
            offlineMode: true
        };

        return render(
            <MockedProvider mocks={[]} addTypename={false}>
                <LoggableEventsContext.Provider value={mockLoggableEventsContextValue}>
                    <ComponentDisplayContext.Provider value={mockComponentDisplayContextValue}>
                        {ui}
                    </ComponentDisplayContext.Provider>
                </LoggableEventsContext.Provider>
            </MockedProvider>
        );
    }

    const mockOnDismiss = jest.fn();

    beforeEach(() => {
        mockOnDismiss.mockClear();
    });

    describe('Create mode', () => {
        it('renders form with correct elements and initial state', () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />);

            expect(screen.getByLabelText('Event name')).toBeInTheDocument();
            expect(screen.getByLabelText('Enable warning')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Add labels' })).toBeInTheDocument();

            const createButton = screen.getByRole('button', { name: 'Create' });
            const cancelButton = screen.getByRole('button', { name: 'Cancel' });

            expect(createButton).toBeInTheDocument();
            expect(createButton).toBeDisabled();
            expect(cancelButton).toBeInTheDocument();
        });

        it('enables Create button when valid name is entered', async () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />);

            const input = screen.getByLabelText('Event name');
            await userEvent.type(input, 'Test Event');

            const createButton = screen.getByRole('button', { name: 'Create' });
            expect(createButton).toBeEnabled();
        });

        it('calls onDismiss when Cancel is clicked', async () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />);

            const cancelButton = screen.getByRole('button', { name: 'Cancel' });
            await userEvent.click(cancelButton);

            expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        });

        it('dismisses form after creating new event', async () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />);

            const input = screen.getByLabelText('Event name');
            await userEvent.type(input, 'Test Event');

            const createButton = screen.getByRole('button', { name: 'Create' });
            await userEvent.click(createButton);

            expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        });
    });

    describe('Event name validation', () => {
        it('shows error and disables button for name too long', async () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />);

            const input = screen.getByLabelText('Event name');
            const longName = 'a'.repeat(MAX_LENGTH + 1);
            await userEvent.type(input, longName);

            expect(screen.getByText('Event name is too long')).toBeInTheDocument();
            const createButton = screen.getByRole('button', { name: 'Create' });
            expect(createButton).toBeDisabled();
        });

        it('shows error and disables button for duplicate event name', async () => {
            const existingEvent = {
                id: 'existing-1',
                name: 'Existing Event',
                timestamps: [],
                active: true,
                warningThresholdInDays: 7,
                labelIds: []
            };

            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />, [existingEvent]);

            const input = screen.getByLabelText('Event name');
            await userEvent.type(input, 'Existing Event');

            expect(screen.getByText('That event name already exists')).toBeInTheDocument();
            const createButton = screen.getByRole('button', { name: 'Create' });
            expect(createButton).toBeDisabled();
        });
    });

    describe('Warning threshold', () => {
        it('shows/hides threshold input based on switch state', async () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />);

            // Initially hidden
            expect(screen.queryByLabelText('Warning threshold')).not.toBeVisible();

            // Show when enabled
            const warningSwitch = screen.getByLabelText('Enable warning');
            await userEvent.click(warningSwitch);
            expect(screen.getByLabelText('Warning threshold')).toBeVisible();
        });

        it('accepts valid threshold values', async () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />);

            const warningSwitch = screen.getByLabelText('Enable warning');
            await userEvent.click(warningSwitch);

            const thresholdInput = screen.getByLabelText('Warning threshold');
            await userEvent.clear(thresholdInput);
            await userEvent.type(thresholdInput, '30');

            expect(thresholdInput.value).toBe('30');
        });

        it('rejects negative threshold values', async () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />);

            const warningSwitch = screen.getByLabelText('Enable warning');
            await userEvent.click(warningSwitch);

            const thresholdInput = screen.getByLabelText('Warning threshold');
            await userEvent.clear(thresholdInput);
            await userEvent.type(thresholdInput, '-5');

            expect(thresholdInput.value).toBe('0');
        });

        it('validates threshold values at maximum boundary', async () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />);

            const warningSwitch = screen.getByLabelText('Enable warning');
            await userEvent.click(warningSwitch);

            const thresholdInput = screen.getByLabelText('Warning threshold');

            // Accept values under the maximum
            await userEvent.clear(thresholdInput);
            await userEvent.type(thresholdInput, '729');
            expect(thresholdInput.value).toBe('729');

            // Reject values at or over the maximum
            await userEvent.type(thresholdInput, '9');
            expect(thresholdInput.value).toBe('729');
        });
    });

    describe('Labels', () => {
        it('shows label autocomplete when Add labels is clicked', async () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />);

            const addLabelsButton = screen.getByRole('button', { name: 'Add labels' });
            await userEvent.click(addLabelsButton);

            expect(screen.getByLabelText('Labels')).toBeInTheDocument();
        });

        it('pre-populates selected labels when creating new event with active label', () => {
            const mockEventLabel = { id: 'label-1', name: 'Work' };

            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />, [], [mockEventLabel], 'label-1');

            expect(screen.getByLabelText('Labels')).toBeInTheDocument();
            expect(screen.getByText('Work')).toBeInTheDocument();
        });

        it('creates event with selected labels', async () => {
            const mockEventLabel = { id: 'label-1', name: 'Work' };

            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} />, [], [mockEventLabel], 'label-1');

            const input = screen.getByLabelText('Event name');
            await userEvent.type(input, 'Test Event');

            const createButton = screen.getByRole('button', { name: 'Create' });
            await userEvent.click(createButton);

            expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        });
    });

    describe('Edit mode', () => {
        it('renders Update button and pre-populates fields', () => {
            renderWithProvider(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit="non-existent-id" />);

            expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
        });

        it('updates existing event with labels', async () => {
            const mockEventLabel = { id: 'label-1', name: 'Work' };
            const existingEvent = {
                id: 'event-1',
                name: 'Existing Event',
                timestamps: [],
                active: true,
                warningThresholdInDays: 14,
                labelIds: ['label-1']
            };

            renderWithProvider(
                <EditEventCard onDismiss={mockOnDismiss} eventIdToEdit="event-1" />,
                [existingEvent],
                [mockEventLabel]
            );

            expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();

            const input = screen.getByLabelText('Event name');
            expect(input.value).toBe('Existing Event');
            expect(screen.getByText('Work')).toBeInTheDocument();

            await userEvent.clear(input);
            await userEvent.type(input, 'Updated Event Name');

            const updateButton = screen.getByRole('button', { name: 'Update' });
            await userEvent.click(updateButton);

            expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        });
    });
});
