import { LoggableEvent, LoggableEventFragment } from '../utils/types';
import { createMockEventLabel, createMockEventLabelFragment } from './eventLabels';

const mockLoggableEvent: LoggableEvent = {
    id: 'event-1',
    name: 'Test Event 1',
    timestamps: [new Date('2023-01-01T00:00:00Z')],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    warningThresholdInDays: 7,
    labelIds: [
        createMockEventLabel({ id: 'label-1', name: 'Work' }).id,
        createMockEventLabel({ id: 'label-2', name: 'Personal' }).id
    ],
    isSynced: true
};

export const createMockLoggableEvent = (overrides: Partial<LoggableEvent> = {}): LoggableEvent => {
    return {
        ...mockLoggableEvent,
        ...overrides
    };
};

const mockLoggableEventFragment: LoggableEventFragment = {
    id: 'event-1',
    name: 'Test Event 1',
    timestamps: ['2023-01-01T00:00:00Z'],
    createdAt: '2023-01-01T00:00:00Z',
    warningThresholdInDays: 7,
    labels: [
        createMockEventLabelFragment({ id: 'label-1', name: 'Work' }),
        createMockEventLabelFragment({ id: 'label-2', name: 'Personal' })
    ]
};

export const createMockLoggableEventFragment = (
    overrides: Partial<LoggableEventFragment> = {}
): LoggableEventFragment => {
    return {
        ...mockLoggableEventFragment,
        ...overrides
    };
};
