import Grid from '@mui/material/Grid';
import teal from '@mui/material/colors/teal';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { useLoggableEventsContext } from './LoggableEventsProvider';
import LoggableEventCard from './LoggableEventCard';
import LoggableEventList from './LoggableEventList';
import CreateEventForm from './CreateEventForm';

const LoggableEventsView = () => {
    const { loggableEvents } = useLoggableEventsContext();

    return (
        <Grid
            container
            wrap="nowrap"
            css={css`
                height: 100vh;
            `}>
            <Grid
                item
                css={css`
                    background-color: ${teal[50]};
                    padding: 40px;
                    max-width: 380px;
                `}>
                <CreateEventForm />

                <div
                    css={css`
                        display: block;
                    `}>
                    <LoggableEventList />
                </div>
            </Grid>

            <Grid
                item
                css={css`
                    padding: 40px;
                `}>
                <Grid container spacing={2}>
                    {loggableEvents
                        .filter(({ active }) => active)
                        .map(({ id }) => {
                            return (
                                <Grid item key={`${id}-card`}>
                                    <LoggableEventCard eventId={id} />
                                </Grid>
                            );
                        })}
                </Grid>
            </Grid>
        </Grid>
    );
};

export default LoggableEventsView;