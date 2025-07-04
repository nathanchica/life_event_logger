import ViewOptionsProvider from './providers/ViewOptionsProvider';
import LoggableEventsProvider from './providers/LoggableEventsProvider';
import EventLoggerPage from './components/EventLoggerPage';

/**
 * Main application component that initializes the app and provides context providers.
 * It uses the AuthProvider's offline mode state.
 */
const App = () => {
    return (
        <ViewOptionsProvider>
            <LoggableEventsProvider>
                <EventLoggerPage />
            </LoggableEventsProvider>
        </ViewOptionsProvider>
    );
};

export default App;
