import { createContext, useContext, useState, ReactNode } from 'react';
import invariant from 'tiny-invariant';

type ComponentDisplayContextType = {
    showLoggableEventEditor: (eventName: string) => void;
    hideLoggableEventEditor: () => void;
    loggableEventNameToEdit: string | null;
};

export const ComponentDisplayContext = createContext<ComponentDisplayContextType | null>(null);

export const useComponentDisplayContext = () => {
    const context = useContext(ComponentDisplayContext);
    invariant(context, 'This component must be wrapped by ComponentDisplayProvider');
    return context;
};

type Props = {
    children: ReactNode;
};

const ComponentDisplayProvider = ({ children }: Props) => {
    const [loggableEventNameToEdit, setLoggableEventNameToEdit] = useState<string | null>(null);

    function showLoggableEventEditor(eventName: string) {
        setLoggableEventNameToEdit(eventName);
    }

    function hideLoggableEventEditor() {
        setLoggableEventNameToEdit(null);
    }

    const contextValue = {
        showLoggableEventEditor,
        hideLoggableEventEditor,
        loggableEventNameToEdit
    };

    return <ComponentDisplayContext.Provider value={contextValue}>{children}</ComponentDisplayContext.Provider>;
};

export default ComponentDisplayProvider;