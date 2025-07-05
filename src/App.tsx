import EventLoggerPage from './components/EventLoggerPage';
import AuthProvider from './providers/AuthProvider';
import LoggableEventsProvider from './providers/LoggableEventsProvider';
import ViewOptionsProvider from './providers/ViewOptionsProvider';

/**
 * Main application component that initializes the app and provides context providers.
 * External providers in index.tsx
 */
const App = () => {
    return (
        <AuthProvider>
            <ViewOptionsProvider>
                <LoggableEventsProvider>
                    <EventLoggerPage />
                </LoggableEventsProvider>
            </ViewOptionsProvider>
        </AuthProvider>
    );
};

export default App;
