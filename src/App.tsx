import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import ViewOptionsProvider from './providers/ViewOptionsProvider';
import LoggableEventsProvider from './providers/LoggableEventsProvider';
import EventLoggerPage from './components/EventLoggerPage';

/**
 * Main application component that initializes the app and provides context providers.
 * It uses the AuthProvider's offline mode state.
 */
const App = () => {
    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <ViewOptionsProvider>
                <LoggableEventsProvider>
                    <EventLoggerPage />
                </LoggableEventsProvider>
            </ViewOptionsProvider>
        </LocalizationProvider>
    );
};

export default App;
