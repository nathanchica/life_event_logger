import { useState, ReactNode } from 'react';
import { Moment } from 'moment';
import invariant from 'tiny-invariant';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardContent from '@mui/material/CardContent';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import LoadingButton from '@mui/lab/LoadingButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';

import blue from '@mui/material/colors/blue';
import grey from '@mui/material/colors/grey';
import red from '@mui/material/colors/red';

import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import EditEventCard from './EditEventCard';
import EventCard from './EventCard';
import { useLoggableEventsContext } from '../../providers/LoggableEventsProvider';
import { getNumberOfDaysBetweenDates } from '../../utils/time';

const DaysSinceLastEventDisplay = ({
    lastEventRecordDate,
    warningThresholdInDays
}: {
    lastEventRecordDate: Date;
    warningThresholdInDays: number;
}) => {
    const daysSinceLastEvent = getNumberOfDaysBetweenDates(lastEventRecordDate, new Date());
    const isViolatingThreshold = warningThresholdInDays > 0 && daysSinceLastEvent >= warningThresholdInDays;

    let content = <Typography variant="caption">Last event: {daysSinceLastEvent} days ago</Typography>;
    if (daysSinceLastEvent === 0) {
        content = <Typography variant="caption">Last event: Today</Typography>;
    } else if (daysSinceLastEvent === 1) {
        content = <Typography variant="caption">Last event: Yesterday</Typography>;
    }

    return (
        <Box
            css={css`
                margin-top: 8px;
                color: ${isViolatingThreshold ? red[500] : 'inherit'};
            `}
        >
            <Stack direction="row" spacing={1}>
                {content}
                {isViolatingThreshold && <WarningAmberIcon color="error" fontSize="small" />}
            </Stack>
        </Box>
    );
};

type EventOptionsDropdownProps = {
    onDismiss: () => void;
    onEditEventClick: () => void;
    onDeleteEventClick: () => void;
};

const EventOptionsDropdown = ({ onDismiss, onEditEventClick, onDeleteEventClick }: EventOptionsDropdownProps) => {
    const DropdownItem = ({ name, icon, onClick }: { name: string; icon: ReactNode; onClick: () => void }) => (
        <ListItem disablePadding>
            <ListItemButton
                css={css`
                    :hover {
                        background-color: ${blue[100]};
                    }
                `}
                onClick={onClick}
            >
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText primary={name} />
            </ListItemButton>
        </ListItem>
    );

    return (
        <ClickAwayListener onClickAway={onDismiss}>
            <Paper
                elevation={5}
                css={css`
                    position: absolute;
                    width: 200px;
                    // https://mui.com/material-ui/customization/z-index/#main-content
                    z-index: 1500;
                `}
            >
                <List disablePadding>
                    <DropdownItem name="Edit event" icon={<EditIcon />} onClick={onEditEventClick} />
                    <DropdownItem name="Delete event" icon={<DeleteIcon />} onClick={onDeleteEventClick} />
                </List>
            </Paper>
        </ClickAwayListener>
    );
};

type Props = {
    eventId: string;
};

const LoggableEventCard = ({ eventId }: Props) => {
    const currDate = new Date();
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

    const [datepickerInputValue, setDatepickerInputValue] = useState(currDate);
    const [datepickerIsShowing, setDatepickerIsShowing] = useState(false);
    const showDatepicker = () => setDatepickerIsShowing(true);
    const hideDatepicker = () => {
        setDatepickerIsShowing(false);
        setDatepickerInputValue(currDate);
    };

    const { loggableEvents, addTimestampToEvent, removeLoggableEvent } = useLoggableEventsContext();
    const currentLoggableEvent = loggableEvents.find(({ id }) => id === eventId);

    invariant(currentLoggableEvent, 'Must be a valid loggable event');

    const { id, name, timestamps, warningThresholdInDays } = currentLoggableEvent;

    const handleLogEventClick = async (dateToAdd?: Date | null) => {
        setIsSubmitting(true);
        await addTimestampToEvent(id, dateToAdd || currDate);
        setIsSubmitting(false);
    };

    const handleEditEventClick = () => {
        setFormIsShowing(true);
        hideEventOptionsDropdown();
    };

    const handleDeleteEventClick = () => {
        removeLoggableEvent(id);
        hideEventOptionsDropdown();
    };

    const handleDatepickerInputChange = (newDate: Moment | null) => {
        setDatepickerInputValue(newDate?.toDate() || currDate);
    };

    const handleDatepickerAccept = (newDate: Moment | null) => {
        handleLogEventClick(newDate ? newDate.toDate() : null);
        hideDatepicker();
    };

    /**
     * Get most recent event record that has happened (not future dates)
     */
    const lastEventRecord = currentLoggableEvent.timestamps.find((eventDate) => {
        return getNumberOfDaysBetweenDates(eventDate, currDate) >= 0;
    });

    return formIsShowing ? (
        <EditEventCard onDismiss={hideForm} eventIdToEdit={id} />
    ) : (
        <EventCard>
            <CardContent>
                <Grid container alignItems="baseline">
                    <Grid item xs={11}>
                        <Typography gutterBottom variant="h5">
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
                                aria-label="unregister event"
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
                <Stack direction="row" spacing={2}>
                    <LoadingButton
                        size="small"
                        loading={isSubmitting}
                        onClick={() => {
                            handleLogEventClick();
                        }}
                        variant="contained"
                    >
                        Log Event
                    </LoadingButton>
                    <Button size="small" disableRipple onClick={showDatepicker}>
                        Log custom date
                    </Button>
                </Stack>

                {lastEventRecord && (
                    <DaysSinceLastEventDisplay
                        lastEventRecordDate={lastEventRecord}
                        warningThresholdInDays={warningThresholdInDays}
                    />
                )}

                <List>
                    <Collapse in={datepickerIsShowing} orientation="vertical">
                        <ListItem disablePadding>
                            <Stack mt={1} direction="row" alignItems="flex-start">
                                <MobileDatePicker
                                    label="Event date"
                                    inputFormat="MM/D/yyyy"
                                    value={datepickerInputValue}
                                    onChange={handleDatepickerInputChange}
                                    renderInput={(params) => (
                                        <TextField
                                            size="small"
                                            helperText="Pick a date to log an event for"
                                            {...params}
                                        />
                                    )}
                                    onAccept={handleDatepickerAccept}
                                    showTodayButton
                                />
                                <IconButton onClick={hideDatepicker}>
                                    <CancelIcon />
                                </IconButton>
                            </Stack>
                        </ListItem>
                    </Collapse>
                    {timestamps.map((record: Date) => {
                        const isFutureDate = getNumberOfDaysBetweenDates(record, currDate) < 0;
                        return (
                            <ListItem disablePadding key={record.toISOString()}>
                                <ListItemText
                                    css={
                                        isFutureDate
                                            ? css`
                                                  color: ${grey[400]};
                                              `
                                            : null
                                    }
                                >
                                    {record.toLocaleString('en-US')}
                                </ListItemText>
                            </ListItem>
                        );
                    })}
                </List>
            </CardContent>
        </EventCard>
    );
};

export default LoggableEventCard;
