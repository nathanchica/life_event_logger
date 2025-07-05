import { useState } from 'react';
import { gql } from '@apollo/client';
import { Moment } from 'moment';
import invariant from 'tiny-invariant';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardContent from '@mui/material/CardContent';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import LoadingButton from '@mui/lab/LoadingButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import Chip from '@mui/material/Chip';

import { visuallyHidden } from '@mui/utils';

import CancelIcon from '@mui/icons-material/Cancel';
import MoreVertIcon from '@mui/icons-material/MoreVert';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import EditEventCard from './EditEventCard';
import EventCard from './EventCard';
import EventLabel from '../EventLabels/EventLabel';
import EventRecord from './EventRecord';
import EventOptionsDropdown from './EventOptionsDropdown';
import LastEventDisplay from './LastEventDisplay';
import { useLoggableEventsContext } from '../../providers/LoggableEventsProvider';
import { getNumberOfDaysBetweenDates } from '../../utils/time';
import { LoggableEvent, LoggableEventFragment } from '../../utils/types';

const MAX_RECORDS_TO_DISPLAY = 5;

const LOGGABLE_EVENT_FRAGMENT = gql`
    fragment LoggableEventFragment on LoggableEvent {
        name
        timestamps
        warningThresholdInDays
        createdAt
        labels {
            ...EventLabelFragment
        }
    }
    ${EventLabel.fragments.eventLabel}
`;

export const createLoggableEventFromFragment = ({
    id,
    name,
    timestamps,
    createdAt,
    warningThresholdInDays,
    labels
}: LoggableEventFragment): LoggableEvent => {
    return {
        id,
        name,
        timestamps: timestamps.map((timestampIsoString) => new Date(timestampIsoString)),
        createdAt: new Date(createdAt),
        warningThresholdInDays,
        labelIds: labels ? labels.map(({ id }) => id) : [],
        isSynced: true
    };
};

type Props = {
    eventId: string;
};

/**
 * LoggableEventCard component for displaying a card that allows users to log events.
 * It shows the event name, a button to log today's event, a button to log a custom date,
 * and a list of previously logged events.
 * It also provides options to edit or delete the event.
 * If the event has not been logged for a certain number of days, it displays a warning.
 */
const LoggableEventCard = ({ eventId }: Props) => {
    const { loggableEvents, addTimestampToEvent, deleteLoggableEvent, eventLabels } = useLoggableEventsContext();
    const currentLoggableEvent = loggableEvents.find(({ id }) => id === eventId);

    invariant(currentLoggableEvent, 'Must be a valid loggable event');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [eventOptionsDropdownIsShowing, setEventOptionsDropdownIsShowing] = useState(false);
    const showEventOptionsDropdown = () => {
        setEventOptionsDropdownIsShowing(true);
    };
    const hideEventOptionsDropdown = () => {
        setEventOptionsDropdownIsShowing(false);
    };

    const [formIsShowing, setFormIsShowing] = useState(false);
    const hideForm = () => {
        setFormIsShowing(false);
    };

    const [datepickerInputValue, setDatepickerInputValue] = useState<Date | undefined>(undefined);
    const [datepickerIsShowing, setDatepickerIsShowing] = useState(false);
    const showDatepicker = () => setDatepickerIsShowing(true);
    const hideDatepicker = () => {
        setDatepickerIsShowing(false);
        setDatepickerInputValue(undefined);
    };

    const { id, name, timestamps, warningThresholdInDays, labelIds } = currentLoggableEvent;
    const eventLabelObjects = labelIds && eventLabels ? eventLabels.filter(({ id }) => labelIds.includes(id)) : [];

    const currDate = new Date();

    const handleLogEventClick = async (dateToAdd?: Date | null) => {
        const date = dateToAdd || currDate;

        setIsSubmitting(true);
        await addTimestampToEvent(id, date);
        setIsSubmitting(false);
    };

    const handleEditEventClick = () => {
        setFormIsShowing(true);
        hideEventOptionsDropdown();
    };

    const handleDeleteEventClick = () => {
        deleteLoggableEvent(id);
        hideEventOptionsDropdown();
    };

    const handleDatepickerInputChange = (newDate: Moment | null) => {
        // guaranteed non-null since MobileDatepicker's clearable is false
        setDatepickerInputValue((newDate as Moment).toDate());
    };

    const handleDatepickerAccept = (newDate: Moment | null) => {
        // guaranteed non-null since MobileDatepicker's clearable is false
        handleLogEventClick((newDate as Moment).toDate());
        hideDatepicker();
    };

    /**
     * Get most recent event record that has happened (not future dates)
     */
    const lastEventRecord = currentLoggableEvent.timestamps.find((eventDate) => {
        return getNumberOfDaysBetweenDates(eventDate, currDate) >= 0;
    });
    const daysSinceLastEvent = lastEventRecord ? getNumberOfDaysBetweenDates(lastEventRecord, currDate) : undefined;

    return formIsShowing ? (
        <EditEventCard onDismiss={hideForm} eventIdToEdit={id} />
    ) : (
        <EventCard role="article" aria-labelledby={`event-title-${id}`}>
            <CardContent>
                <Grid container alignItems="baseline">
                    <Grid item xs={11}>
                        <Typography gutterBottom variant="h5" id={`event-title-${id}`} component="h2">
                            {name}
                        </Typography>
                    </Grid>
                    <Grid item xs={1}>
                        <Box
                            css={css`
                                position: relative;
                            `}
                        >
                            <IconButton
                                onClick={showEventOptionsDropdown}
                                aria-label={`Event options for ${name}`}
                                aria-expanded={eventOptionsDropdownIsShowing}
                                aria-haspopup="menu"
                                component="span"
                            >
                                <MoreVertIcon />
                            </IconButton>
                            {eventOptionsDropdownIsShowing && (
                                <EventOptionsDropdown
                                    onDismiss={hideEventOptionsDropdown}
                                    onDeleteEventClick={handleDeleteEventClick}
                                    onEditEventClick={handleEditEventClick}
                                />
                            )}
                        </Box>
                    </Grid>
                </Grid>
                <Stack direction="row" spacing={2} role="group" aria-label="Event logging actions">
                    <LoadingButton
                        size="small"
                        loading={isSubmitting}
                        disabled={daysSinceLastEvent === 0}
                        onClick={() => {
                            handleLogEventClick();
                        }}
                        variant="contained"
                        aria-describedby={daysSinceLastEvent === 0 ? `today-disabled-${id}` : undefined}
                    >
                        Log Today
                    </LoadingButton>
                    {daysSinceLastEvent === 0 && (
                        <Box id={`today-disabled-${id}`} sx={visuallyHidden}>
                            Already logged today
                        </Box>
                    )}

                    <Button
                        size="small"
                        disableRipple
                        onClick={showDatepicker}
                        aria-expanded={datepickerIsShowing}
                        aria-controls={datepickerIsShowing ? `datepicker-${id}` : undefined}
                    >
                        Log custom date
                    </Button>
                </Stack>

                {typeof daysSinceLastEvent === 'number' && (
                    <LastEventDisplay
                        daysSinceLastEvent={daysSinceLastEvent}
                        warningThresholdInDays={warningThresholdInDays}
                    />
                )}

                <List>
                    <Collapse in={datepickerIsShowing} orientation="vertical">
                        <ListItem disablePadding>
                            <Stack
                                mt={1}
                                direction="row"
                                alignItems="flex-start"
                                id={`datepicker-${id}`}
                                role="group"
                                aria-label="Select date to log event"
                            >
                                <MobileDatePicker
                                    label="Event date"
                                    inputFormat="MM/D/yyyy"
                                    value={datepickerInputValue}
                                    onChange={handleDatepickerInputChange}
                                    shouldDisableDate={(date) =>
                                        timestamps.some(
                                            (record: Date) => record.toDateString() === date.toDate().toDateString()
                                        )
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            size="small"
                                            helperText="Pick a date to log an event for"
                                            aria-describedby={`datepicker-help-${id}`}
                                            {...params}
                                        />
                                    )}
                                    onAccept={handleDatepickerAccept}
                                    onClose={hideDatepicker}
                                />
                                <Box id={`datepicker-help-${id}`} sx={visuallyHidden}>
                                    Dates already logged are disabled
                                </Box>
                                <IconButton onClick={hideDatepicker} aria-label="Cancel date selection">
                                    <CancelIcon />
                                </IconButton>
                            </Stack>
                        </ListItem>
                    </Collapse>

                    {timestamps.length > 0 && (
                        <Typography variant="subtitle2" id={`records-heading-${id}`} role="heading" aria-level={3}>
                            Records {timestamps.length >= MAX_RECORDS_TO_DISPLAY ? ' (Up to 5 most recent)' : ''}
                        </Typography>
                    )}
                    <Box
                        role="list"
                        aria-labelledby={`records-heading-${id}`}
                        aria-label={timestamps.length === 0 ? 'No event records' : `${timestamps.length} event records`}
                    >
                        {timestamps.slice(0, MAX_RECORDS_TO_DISPLAY).map((record: Date) => (
                            <EventRecord
                                key={`${id}-${record.toISOString()}`}
                                eventId={id}
                                recordDate={record}
                                currentDate={currDate}
                            />
                        ))}
                    </Box>
                </List>

                {/* Event labels */}
                {eventLabelObjects.length > 0 && (
                    <Box mt={1} display="flex" flexWrap="wrap" gap={1} role="group" aria-label="Event labels">
                        {eventLabelObjects.map(({ id: labelId, name: labelName }) => (
                            <Chip
                                key={labelId}
                                label={labelName}
                                size="small"
                                role="listitem"
                                aria-label={`Label: ${labelName}`}
                            />
                        ))}
                    </Box>
                )}
            </CardContent>
        </EventCard>
    );
};

LoggableEventCard.fragments = {
    loggableEvent: LOGGABLE_EVENT_FRAGMENT
};

export default LoggableEventCard;
