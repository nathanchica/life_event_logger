import AddIcon from '@mui/icons-material/Add';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { InputBaseComponentProps } from '@mui/material/InputBase';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import invariant from 'tiny-invariant';

import { useEventLabels, CreateEventLabelPayload } from '../../hooks/useEventLabels';
import { EventLabel } from '../../utils/types';
import { validateEventLabelName, MAX_LABEL_LENGTH } from '../../utils/validation';
import { createEventLabelFromFragment } from '../EventLabels/EventLabel';

const CREATE_NEW_LABEL_PREFIX = '__CREATE_NEW__';

type Props = {
    selectedLabels: EventLabel[];
    setSelectedLabels: React.Dispatch<React.SetStateAction<EventLabel[]>>;
    existingLabels: EventLabel[];
};

/**
 * EventLabelAutocomplete component for selecting and creating event labels.
 * It allows users to search for existing labels or create new ones.
 * The component uses an Autocomplete input with multiple selection enabled.
 */
const EventLabelAutocomplete = ({ selectedLabels, setSelectedLabels, existingLabels }: Props) => {
    const { createEventLabel } = useEventLabels();
    const theme = useTheme();

    const isDarkMode = theme.palette.mode === 'dark';

    const labelOptions = existingLabels.filter((label) => !selectedLabels.some(({ id }) => id === label.id));
    const existingLabelNames = existingLabels.map((label) => label.name);

    const getFilteredOptions = (inputValue: string) => {
        let filteredOptions = labelOptions
            .filter((label) => label.name.toLowerCase().includes(inputValue.toLowerCase()))
            .map(({ name }) => name);

        // Add "Create new label" option if input doesn't match any existing label and is valid
        if (inputValue && !existingLabelNames.some((name) => name.toLowerCase() === inputValue.toLowerCase())) {
            const validationError = validateEventLabelName(inputValue, existingLabelNames);
            if (validationError === null) {
                filteredOptions = [...filteredOptions, `${CREATE_NEW_LABEL_PREFIX}${inputValue}`];
            }
        }

        return filteredOptions;
    };

    const handleCreateNewLabel = (labelName: string) => {
        const validationError = validateEventLabelName(labelName, existingLabelNames);
        if (validationError === null) {
            const onCompleted = (payload: { createEventLabel: CreateEventLabelPayload }) => {
                const newLabel = createEventLabelFromFragment(payload.createEventLabel.eventLabel);
                setSelectedLabels((prev) => [...prev, newLabel]);
            };
            createEventLabel({ name: labelName }, onCompleted);
        }
    };

    return (
        <Autocomplete
            multiple
            freeSolo
            filterOptions={(options, params) => {
                return getFilteredOptions(params.inputValue);
            }}
            options={[]}
            value={selectedLabels.map(({ name }) => name)}
            onChange={(_, values, reason) => {
                // Handle "Create new label" selection
                const createNewValues = values.filter((val: string) => val.startsWith(CREATE_NEW_LABEL_PREFIX));
                createNewValues.forEach((val: string) => {
                    const labelName = val.replace(CREATE_NEW_LABEL_PREFIX, '');
                    handleCreateNewLabel(labelName);
                });

                // Handle label creation separately from selection (for freeSolo input)
                const newLabelsToCreate = values.filter(
                    (val: string) =>
                        reason === 'createOption' &&
                        !val.startsWith(CREATE_NEW_LABEL_PREFIX) &&
                        !existingLabelNames.includes(val) &&
                        !selectedLabels.some((label) => label.name === val)
                );

                // Create new labels if needed
                newLabelsToCreate.forEach((val: string) => {
                    handleCreateNewLabel(val);
                });

                // Update selected labels with existing labels only (filter out create new options)
                const existingSelectedLabels = values
                    .filter((val: string) => !val.startsWith(CREATE_NEW_LABEL_PREFIX))
                    .map((val: string) => existingLabels.find((label) => label.name === val))
                    .filter((label): label is EventLabel => label !== undefined);

                setSelectedLabels(existingSelectedLabels);
            }}
            renderValue={(value, getTagProps) =>
                value
                    .filter((option) => existingLabels.some((label) => label.name === option))
                    .map((option, index) => {
                        const label = existingLabels.find((label) => label.name === option);
                        invariant(label, `Label not found for option: ${option}`);
                        return (
                            <Chip
                                label={label.name}
                                size="small"
                                {...getTagProps({ index })}
                                key={`chip-${label.name}`}
                            />
                        );
                    })
            }
            renderOption={(props, option) => {
                if (option.startsWith(CREATE_NEW_LABEL_PREFIX)) {
                    const labelName = option.replace(CREATE_NEW_LABEL_PREFIX, '');
                    return (
                        <Box component="li" {...props} key={option}>
                            <AddIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2">Create new label: {labelName}</Typography>
                        </Box>
                    );
                }
                return (
                    <Box component="li" {...props} key={option}>
                        <Typography variant="body2">{option}</Typography>
                    </Box>
                );
            }}
            renderInput={(params) => {
                const inputValue = (params.inputProps as InputBaseComponentProps).value || '';
                let error = false;
                let helperText = '';
                if (inputValue) {
                    const validationError = validateEventLabelName(inputValue, existingLabelNames);
                    if (validationError === 'TooLongName') {
                        error = true;
                        helperText = `Max ${MAX_LABEL_LENGTH} characters`;
                    }
                }
                return (
                    <TextField
                        {...params}
                        variant="standard"
                        label="Labels"
                        color={isDarkMode ? 'primary' : 'primary'}
                        placeholder="Type to search or create labels"
                        autoFocus
                        error={error}
                        helperText={helperText}
                    />
                );
            }}
            sx={{ mt: 2, mb: 1 }}
            disableCloseOnSelect
            blurOnSelect
        />
    );
};

export default EventLabelAutocomplete;
