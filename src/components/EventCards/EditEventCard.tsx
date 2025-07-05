import { useState, ChangeEventHandler, SyntheticEvent } from 'react';

import { css } from '@emotion/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Collapse from '@mui/material/Collapse';
import blueGrey from '@mui/material/colors/blueGrey';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import { useTheme } from '@mui/material/styles';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { visuallyHidden } from '@mui/utils';

import { useLoggableEventsContext, EVENT_DEFAULT_VALUES } from '../../providers/LoggableEventsProvider';
import { useViewOptions } from '../../providers/ViewOptionsProvider';
import { EventLabel } from '../../utils/types';

import EventCard from './EventCard';
import EventLabelAutocomplete from './EventLabelAutocomplete';
import WarningThresholdForm from './WarningThresholdForm';

export const MAX_LENGTH = 25;

type Props = {
    onDismiss: () => void;
    eventIdToEdit?: string;
};

const WarningSwitch = ({ checked, onChange }: { checked: boolean; onChange: (newCheckedValue: boolean) => void }) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange(event.target.checked);
    };

    return (
        <FormGroup>
            <FormControlLabel
                control={
                    <Switch checked={checked} onChange={handleChange} aria-describedby="warning-switch-description" />
                }
                label="Enable warning"
            />
        </FormGroup>
    );
};

/**
 * EditEventCard component for editing an existing event.
 *
 * It allows users to change the event name and set a warning threshold.
 *
 * It also provides a form to create a new event if no eventIdToEdit is provided.
 *
 * It includes validation for the event name and warning threshold.
 *
 * It displays a form with input fields for the event name and warning threshold,
 * and buttons to submit or cancel the changes.
 */
const EditEventCard = ({ onDismiss, eventIdToEdit }: Props) => {
    /** Context */
    const { loggableEvents, createLoggableEvent, updateLoggableEventDetails, eventLabels } = useLoggableEventsContext();
    const { activeEventLabelId } = useViewOptions();

    const theme = useTheme();

    const eventToEdit = loggableEvents.find(({ id }) => id === eventIdToEdit) || EVENT_DEFAULT_VALUES;
    const isCreatingNewEvent = !eventIdToEdit;

    /** Event name */
    const [eventNameInputValue, setEventNameInputValue] = useState(eventToEdit.name);
    const resetEventNameInputValue = () => setEventNameInputValue(EVENT_DEFAULT_VALUES.name);

    const eventNameIsTooLong = eventNameInputValue.length > MAX_LENGTH;
    const eventNameAlreadyExists = Boolean(
        loggableEvents.find(({ id, name }) => id !== eventIdToEdit && name === eventNameInputValue)
    );
    const eventNameIsValid =
        eventNameInputValue.length > 0 && eventNameInputValue.length <= MAX_LENGTH && !eventNameAlreadyExists;

    /** Event name validation error display */
    let textFieldErrorProps: { error?: boolean; helperText?: string } = {};
    if (eventNameIsTooLong) {
        textFieldErrorProps = {
            error: true,
            helperText: 'Event name is too long'
        };
    } else if (eventNameAlreadyExists) {
        textFieldErrorProps = {
            error: true,
            helperText: 'That event name already exists'
        };
    }

    /**
     * Warning threshold.
     * Default to disabled. Initialize as enabled if the event being edited has an existing value
     */
    const [warningIsEnabled, setWarningIsEnabled] = useState(
        eventIdToEdit ? eventToEdit.warningThresholdInDays > 0 : false
    );
    const defaultWarningThreshold = isCreatingNewEvent
        ? EVENT_DEFAULT_VALUES.warningThresholdInDays
        : eventToEdit.warningThresholdInDays;
    const [warningThresholdInDays, setWarningThresholdInDays] = useState(defaultWarningThreshold);
    const resetWarningThresholdInputValue = () => setWarningThresholdInDays(defaultWarningThreshold);
    const warningThresholdValueToSave = warningIsEnabled ? warningThresholdInDays : 0;

    /**
     * Labels
     */
    const activeEventLabel = activeEventLabelId ? eventLabels.find(({ id }) => id === activeEventLabelId) : undefined;
    const [showLabelInput, setShowLabelInput] = useState(
        isCreatingNewEvent ? Boolean(activeEventLabelId) : eventToEdit.labelIds && eventToEdit.labelIds.length > 0
    );
    const [selectedLabels, setSelectedLabels] = useState<EventLabel[]>(() => {
        if (isCreatingNewEvent && activeEventLabel) {
            return [activeEventLabel];
        }
        // If editing, pre-populate with existing labels
        return eventToEdit.labelIds ? eventLabels.filter(({ id }) => eventToEdit.labelIds.includes(id)) : [];
    });

    /** Handlers */
    const dismissForm = () => {
        resetEventNameInputValue();
        resetWarningThresholdInputValue();
        onDismiss();
    };

    const handleEventNameInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        setEventNameInputValue(event.currentTarget.value);
    };

    const handleWarningThresholdChange = (thresholdInDays: number) => {
        setWarningThresholdInDays(thresholdInDays);
    };

    const handleWarningToggleChange = (newCheckedValue: boolean) => {
        setWarningIsEnabled(newCheckedValue);
    };

    /** Save handlers */
    const handleNewEventSubmit = (event: SyntheticEvent) => {
        event.preventDefault();
        if (eventNameIsValid) {
            createLoggableEvent(
                eventNameInputValue,
                warningThresholdValueToSave,
                selectedLabels.map(({ id }) => id)
            );
            dismissForm();
        }
    };

    const handleUpdateEventSubmit = (event: SyntheticEvent) => {
        event.preventDefault();
        if (eventNameIsValid) {
            updateLoggableEventDetails({
                ...eventToEdit,
                name: eventNameInputValue,
                warningThresholdInDays: warningThresholdValueToSave,
                labelIds: selectedLabels.map(({ id }) => id)
            });
            dismissForm();
        }
    };

    return (
        <ClickAwayListener onClickAway={dismissForm} mouseEvent="onMouseDown" touchEvent="onTouchStart">
            <Box
                component="form"
                onSubmit={eventIdToEdit ? handleUpdateEventSubmit : handleNewEventSubmit}
                role="form"
                aria-label={isCreatingNewEvent ? 'Create new event' : 'Edit event'}
            >
                <EventCard
                    css={css`
                        background-color: ${theme.palette.mode === 'dark' ? blueGrey[900] : blueGrey[50]};
                    `}
                >
                    <CardContent>
                        {/* Event name */}
                        <TextField
                            autoComplete="off"
                            autoFocus
                            id="new-event-input"
                            label="Event name"
                            {...textFieldErrorProps}
                            value={eventNameInputValue}
                            onChange={handleEventNameInputChange}
                            fullWidth
                            variant="standard"
                            margin="normal"
                            aria-required="true"
                            aria-invalid={!eventNameIsValid}
                            aria-describedby={textFieldErrorProps.error ? 'event-name-error' : undefined}
                        />

                        {/* Warning threshold */}
                        <Box aria-describedby="warning-switch-description">
                            <WarningSwitch checked={warningIsEnabled} onChange={handleWarningToggleChange} />
                            <Typography id="warning-switch-description" sx={visuallyHidden}>
                                Toggle to enable warning notifications for this event
                            </Typography>
                        </Box>
                        <Collapse in={warningIsEnabled}>
                            <WarningThresholdForm
                                onChange={handleWarningThresholdChange}
                                initialThresholdInDays={defaultWarningThreshold}
                            />
                        </Collapse>

                        {/* Labels */}
                        {!showLabelInput ? (
                            <Button
                                variant="text"
                                size="small"
                                sx={{ mt: 2, mb: 1 }}
                                onClick={() => setShowLabelInput(true)}
                                aria-describedby="labels-section-description"
                            >
                                Add labels
                            </Button>
                        ) : (
                            <Box aria-labelledby="labels-section-label">
                                <Typography id="labels-section-label" sx={visuallyHidden}>
                                    Event labels
                                </Typography>
                                <EventLabelAutocomplete
                                    selectedLabels={selectedLabels}
                                    setSelectedLabels={setSelectedLabels}
                                />
                            </Box>
                        )}
                        <Typography id="labels-section-description" sx={visuallyHidden}>
                            Add labels to categorize and organize your events
                        </Typography>
                    </CardContent>

                    <CardActions>
                        <Button
                            disabled={!eventNameIsValid}
                            type="submit"
                            size="small"
                            aria-describedby={!eventNameIsValid ? 'submit-button-disabled-reason' : undefined}
                        >
                            {eventIdToEdit ? 'Update' : 'Create'}
                        </Button>
                        <Button onClick={dismissForm} size="small" aria-label="Cancel and close form">
                            Cancel
                        </Button>
                        {!eventNameIsValid && (
                            <Typography id="submit-button-disabled-reason" sx={visuallyHidden}>
                                Submit button is disabled because the event name is invalid
                            </Typography>
                        )}
                    </CardActions>
                </EventCard>
            </Box>
        </ClickAwayListener>
    );
};

export default EditEventCard;
