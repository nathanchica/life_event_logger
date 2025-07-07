import { useState, useEffect } from 'react';

import { ApolloProvider, ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { createApolloClient } from './apollo/client';
import EventLoggerPage from './components/EventLoggerPage';
import AuthProvider from './providers/AuthProvider';
import LoggableEventsProvider from './providers/LoggableEventsProvider';
import ViewOptionsProvider from './providers/ViewOptionsProvider';

/**
 * Main application component that initializes the app and provides all context providers.
 * Now uses the new Apollo Client setup with cache persistence and offline support.
 */
const App = () => {
    const [apolloClient, setApolloClient] = useState<ApolloClient<NormalizedCacheObject> | null>(null);

    // Check if offline mode is requested via URL parameter
    const isOfflineMode = new URLSearchParams(window.location.search).has('offline');

    useEffect(() => {
        // Initialize Apollo Client with cache persistence and offline support
        createApolloClient(isOfflineMode).then(setApolloClient);
    }, [isOfflineMode]);

    // Don't render anything while Apollo Client is being initialized
    if (!apolloClient) {
        return null;
    }

    return (
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
            <ApolloProvider client={apolloClient}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                    <AuthProvider>
                        <ViewOptionsProvider>
                            <LoggableEventsProvider>
                                <EventLoggerPage />
                            </LoggableEventsProvider>
                        </ViewOptionsProvider>
                    </AuthProvider>
                </LocalizationProvider>
            </ApolloProvider>
        </GoogleOAuthProvider>
    );
};

export default App;
