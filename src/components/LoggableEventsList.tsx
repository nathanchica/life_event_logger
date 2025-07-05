import Grid from '@mui/material/Grid';

import { useLoggableEventsContext } from '../providers/LoggableEventsProvider';
import { useViewOptions } from '../providers/ViewOptionsProvider';
import { LoggableEvent } from '../utils/types';

import { EventCardSkeleton } from './EventCards/EventCard';
import LoggableEventCard from './EventCards/LoggableEventCard';

type Props = {
    offlineMode?: boolean;
};

const LoggableEventsList = ({ offlineMode = false }: Props) => {
    const { activeEventLabelId } = useViewOptions();
    const { dataIsLoaded, loggableEvents } = useLoggableEventsContext();

    if (!dataIsLoaded && !offlineMode) {
        return (
            <>
                <Grid item role="listitem">
                    <EventCardSkeleton />
                </Grid>
                <Grid item role="listitem">
                    <EventCardSkeleton />
                </Grid>
                <Grid item role="listitem">
                    <EventCardSkeleton />
                </Grid>
            </>
        );
    }

    const filteredEvents: Array<LoggableEvent> = activeEventLabelId
        ? loggableEvents.filter(({ labelIds }) => labelIds && labelIds.includes(activeEventLabelId))
        : loggableEvents;

    return (
        <>
            {filteredEvents.map(({ id }) => {
                return (
                    <Grid item key={id} role="listitem">
                        <LoggableEventCard eventId={id} />
                    </Grid>
                );
            })}
        </>
    );
};

export default LoggableEventsList;
