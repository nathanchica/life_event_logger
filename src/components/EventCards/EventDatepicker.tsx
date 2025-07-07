import { useState } from 'react';

import CancelIcon from '@mui/icons-material/Cancel';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import Stack from '@mui/material/Stack';
import { visuallyHidden } from '@mui/utils';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { Moment } from 'moment';

type Props = {
    eventId: string;
    isShowing: boolean;
    disabledDates: Date[];
    onAccept: (date: Date) => void;
    onClose: () => void;
};

const EventDatepicker = ({ eventId, isShowing, disabledDates, onAccept, onClose }: Props) => {
    const [inputValue, setInputValue] = useState<Moment | null>(null);

    const handleInputChange = (newDate: Moment | null) => {
        setInputValue(newDate);
    };

    const handleAccept = (newDate: Moment | null) => {
        if (newDate) {
            onAccept(newDate.toDate());
        }
        setInputValue(null);
    };

    const handleClose = () => {
        onClose();
        setInputValue(null);
    };

    return (
        <Collapse in={isShowing} orientation="vertical" sx={{ mt: 2 }}>
            <ListItem disablePadding>
                <Stack
                    mt={1}
                    direction="row"
                    alignItems="flex-start"
                    id={`datepicker-${eventId}`}
                    role="group"
                    aria-label="Select date to log event"
                >
                    <MobileDatePicker
                        label="Event date"
                        format="MM/D/yyyy"
                        value={inputValue}
                        onChange={handleInputChange}
                        shouldDisableDate={(date) =>
                            disabledDates.some((record: Date) => record.toDateString() === date.toDate().toDateString())
                        }
                        onAccept={handleAccept}
                        onClose={handleClose}
                        slotProps={{
                            textField: {
                                size: 'small',
                                helperText: 'Pick a date to log an event for',
                                'aria-describedby': `datepicker-help-${eventId}`
                            }
                        }}
                    />
                    <Box id={`datepicker-help-${eventId}`} sx={visuallyHidden}>
                        Dates already logged are disabled
                    </Box>
                    <IconButton onClick={handleClose} aria-label="Cancel date selection">
                        <CancelIcon />
                    </IconButton>
                </Stack>
            </ListItem>
        </Collapse>
    );
};

export default EventDatepicker;
