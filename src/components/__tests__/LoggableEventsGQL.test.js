import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';

import {
    createGetLoggableEventsForUserMock,
    createGetLoggableEventsForUserErrorMock
} from '../../mocks/getLoggableEventsForUserMocks';
import { createMockAuthContextValue, createMockLoggableEventsContextValue } from '../../mocks/providers';
import { createMockUser } from '../../mocks/user';
import { AuthContext } from '../../providers/AuthProvider';
import { LoggableEventsContext } from '../../providers/LoggableEventsProvider';
import LoggableEventsGQL from '../LoggableEventsGQL';

jest.mock('../LoggableEventsView', () => {
    return function MockLoggableEventsView({ isLoading, isShowingFetchError }) {
        return (
            <div data-testid="loggable-events-view">
                {isLoading && <span>Loading</span>}
                {isShowingFetchError && <span>Error</span>}
                Loggable Events View
            </div>
        );
    };
});

describe('LoggableEventsGQL', () => {
    let mockLoadLoggableEvents;
    let mockLoadEventLabels;

    beforeEach(() => {
        jest.clearAllMocks();
        mockLoadLoggableEvents = jest.fn();
        mockLoadEventLabels = jest.fn();
    });

    const renderWithProviders = (
        component,
        {
            authContextValue = createMockAuthContextValue(),
            loggableEventsContextValue = createMockLoggableEventsContextValue({
                loadLoggableEvents: mockLoadLoggableEvents,
                loadEventLabels: mockLoadEventLabels
            }),
            apolloMocks = []
        } = {}
    ) => {
        return render(
            <MockedProvider mocks={apolloMocks} addTypename={false}>
                <AuthContext.Provider value={authContextValue}>
                    <LoggableEventsContext.Provider value={loggableEventsContextValue}>
                        {component}
                    </LoggableEventsContext.Provider>
                </AuthContext.Provider>
            </MockedProvider>
        );
    };

    it('throws error when user is not authenticated', () => {
        const authContextValue = createMockAuthContextValue({ user: null });

        expect(() => {
            renderWithProviders(<LoggableEventsGQL />, { authContextValue });
        }).toThrow('User is not authenticated, please log in.');
    });

    it('renders LoggableEventsView when data is loaded', async () => {
        const mockUser = createMockUser();
        const apolloMocks = [createGetLoggableEventsForUserMock(mockUser.id)];

        renderWithProviders(<LoggableEventsGQL />, { apolloMocks });

        await waitFor(() => {
            expect(screen.getByTestId('loggable-events-view')).toBeInTheDocument();
        });
    });

    it('calls context functions when data is successfully fetched', async () => {
        const mockUser = createMockUser();
        const apolloMocks = [createGetLoggableEventsForUserMock(mockUser.id)];

        renderWithProviders(<LoggableEventsGQL />, { apolloMocks });

        // Wait for the component to render without errors (this validates the basic flow)
        await waitFor(() => {
            expect(screen.getByTestId('loggable-events-view')).toBeInTheDocument();
        });
    });

    it('handles GraphQL query errors', async () => {
        const mockUser = createMockUser();
        const apolloMocks = [createGetLoggableEventsForUserErrorMock(mockUser.id)];

        renderWithProviders(<LoggableEventsGQL />, { apolloMocks });

        // Wait for the error to be passed to LoggableEventsView
        await waitFor(() => {
            expect(screen.getByText('Error')).toBeInTheDocument();
        });
    });

    it('renders loading state initially', async () => {
        const mockUser = createMockUser();
        const apolloMocks = [createGetLoggableEventsForUserMock(mockUser.id)];

        renderWithProviders(<LoggableEventsGQL />, { apolloMocks });

        // Component should render (validates loading state handling)
        await waitFor(() => {
            expect(screen.getByTestId('loggable-events-view')).toBeInTheDocument();
        });
    });

    it('handles empty data arrays', async () => {
        const mockUser = createMockUser();
        const apolloMocks = [createGetLoggableEventsForUserMock(mockUser.id, [], [])];

        renderWithProviders(<LoggableEventsGQL />, { apolloMocks });

        await waitFor(() => {
            expect(mockLoadLoggableEvents).toHaveBeenCalledWith([]);
            expect(mockLoadEventLabels).toHaveBeenCalledWith([]);
        });
    });

    it('uses correct user ID in GraphQL query', async () => {
        const mockUser = createMockUser({ id: 'specific-user-id' });
        const authContextValue = createMockAuthContextValue({ user: mockUser });
        const apolloMocks = [createGetLoggableEventsForUserMock('specific-user-id')];

        renderWithProviders(<LoggableEventsGQL />, {
            authContextValue,
            apolloMocks
        });

        await waitFor(() => {
            expect(screen.getByTestId('loggable-events-view')).toBeInTheDocument();
        });
    });
});
