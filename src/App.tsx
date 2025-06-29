import { useEffect, useState } from 'react';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import ComponentDisplayProvider from './providers/ComponentDisplayProvider';
import LoggableEventsProvider from './providers/LoggableEventsProvider';
import LoggableEventsView from './components/LoggableEventsView';
import LoginView from './components/LoginView';

const App = () => {
    /**
     * Whether or not the app is in offline mode based on a url parameter. If in offline mode, data will not
     * be fetched or persisted.
     */
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    /**
     * Whether or not the user is logged in. If in offline mode, this will be set to true.
     */
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const hasOfflineInUrlParam = window ? new URLSearchParams(window.location.search).has('offline') : false;
        if (hasOfflineInUrlParam) {
            setIsOfflineMode(true);
            setIsLoggedIn(true);
            console.info('Application is in offline mode.');
        }

        // Check if auth token in cookies, if so then set isLoggedIn to true
    }, []);

    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <ComponentDisplayProvider offlineMode={isOfflineMode}>
                <LoggableEventsProvider offlineMode={isOfflineMode}>
                    {isLoggedIn ? <LoggableEventsView offlineMode={isOfflineMode} /> : <LoginView />}
                </LoggableEventsProvider>
            </ComponentDisplayProvider>
        </LocalizationProvider>
    );
};

export default App;
