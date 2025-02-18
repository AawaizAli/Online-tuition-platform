'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Checkbox,
  IconButton,
  FormControlLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import { Icon } from '@iconify/react';
import LoadingButton from '@mui/lab/LoadingButton';
import { useForm, Controller } from 'react-hook-form';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSettingsContext } from 'src/components/settings';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useDispatch, useSelector } from 'react-redux'; 
import { saveAvailability } from 'src/app/store/slices/availabilityslice';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const times = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM',
];

const convertToDate = (timeString) => {
  const [time, modifier] = timeString.split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);

  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  return new Date(0, 0, 0, hours, minutes);
};

const validationSchema = Yup.object().shape({
  availability: Yup.object().shape(
    days.reduce((acc, day) => {
      acc[day] = Yup.object().shape({
        checked: Yup.boolean().required(),
        slots: Yup.array().of(
          Yup.object().shape({
            start: Yup.string().required(),
            end: Yup.string()
              .required()
              .test('is-greater', 'End time must be greater than start time', function (value) {
                const { start } = this.parent;
                return convertToDate(value) > convertToDate(start);
              }),
          })
        ),
      });
      return acc;
    }, {})
  ),
});

export default function AvailabilityView() {
  const router = useRouter();
  const settings = useSettingsContext();
  const dispatch = useDispatch();
  const availability = useSelector((state) => state.availability);

  const [isBackLoading, setIsBackLoading] = useState(false);
  const [isNextLoading, setIsNextLoading] = useState(false);

  const { control, handleSubmit, formState: { errors }, setValue, getValues } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      availability: days.reduce((acc, day) => {
        acc[day] = {
          checked: true,
          slots: [{ start: '09:00 AM', end: '05:00 PM' }],
        };
        return acc;
      }, {}),
    },
  });

  const onSubmit = (data) => {
    console.log('Submitted Data:', data);
    setIsNextLoading(true);
    dispatch(saveAvailability(data));
    setTimeout(() => {
      setIsNextLoading(false);
      router.push(paths.dashboard.three);
    }, 1000);
  };

  const handleBackClick = () => {
    setIsBackLoading(true);
    setTimeout(() => {
      router.push(paths.dashboard.one);
      setIsBackLoading(false);
    }, 1000); 
  };

  const addSlot = (day) => {
    const currentSlots = getValues(`availability.${day}.slots`);
    const newSlot = { start: '09:00 AM', end: '05:00 PM' };
    setValue(`availability.${day}.slots`, [...currentSlots, newSlot]);
  };

  const removeSlot = (day, index) => {
    const currentSlots = getValues(`availability.${day}.slots`);
    const newSlots = currentSlots.filter((_, idx) => idx !== index);
    setValue(`availability.${day}.slots`, newSlots);
  };

  const handleCheckboxChange = (day) => {
    const isChecked = getValues(`availability.${day}.checked`);
    setValue(`availability.${day}.checked`, !isChecked);
    if (!isChecked) {
      setValue(`availability.${day}.slots[0].start`, '09:00 AM');
      setValue(`availability.${day}.slots[0].end`, '05:00 PM');
    } else {
      setValue(`availability.${day}.slots`, []);
    }
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <Typography variant="h5" sx={{ mb: 4, fontSize: '1.25rem' }}>
        Availability
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={2}>
                <Typography variant="body2" sx={{ fontSize: '0.875rem', mb: 2 }}>
                  Day
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" sx={{ fontSize: '0.875rem', mb: 2 }}>
                  Start Time
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" sx={{ fontSize: '0.875rem', mb: 2 }}>
                  End Time
                </Typography>
              </Grid>
            </Grid>

            {days.map((day) => (
              <Grid container spacing={2} alignItems="center" sx={{ mb: 4 }} key={day}>
                <Grid item xs={2}>
                  <Controller
                    name={`availability.${day}.checked`}
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            {...field}
                            checked={field.value}
                            onChange={() => handleCheckboxChange(day)}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{day}</Typography>}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={10}>
                  <Box>
                    <Controller
                      name={`availability.${day}.slots`}
                      control={control}
                      render={({ field }) => (
                        <Box>
                          {field.value.map((slot, index) => (
                            <Grid container spacing={2} alignItems="center" key={index}>
                              <Grid item xs={4}>
                                <Select
                                  fullWidth
                                  value={slot.start}
                                  onChange={(e) => {
                                    const updatedSlots = [...field.value];
                                    updatedSlots[index].start = e.target.value;
                                    setValue(`availability.${day}.slots`, updatedSlots);
                                  }}
                                  variant="outlined"
                                  displayEmpty
                                  sx={{ height: '56px', mb: 1 }}
                                >
                                  {times.map((time) => (
                                    <MenuItem key={time} value={time}>
                                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{time}</Typography>
                                    </MenuItem>
                                  ))}
                                </Select>
                              </Grid>
                              <Grid item xs={4}>
                                <Select
                                  fullWidth
                                  value={slot.end}
                                  onChange={(e) => {
                                    const updatedSlots = [...field.value];
                                    updatedSlots[index].end = e.target.value;
                                    setValue(`availability.${day}.slots`, updatedSlots);
                                  }}
                                  variant="outlined"
                                  displayEmpty
                                  sx={{ height: '56px', mb: 1 }}
                                >
                                  {times.map((time) => (
                                    <MenuItem key={time} value={time}>
                                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>{time}</Typography>
                                    </MenuItem>
                                  ))}
                                </Select>
                                {errors.availability?.[day]?.slots?.[index]?.end && (
                                  <Typography color="error" sx={{ fontSize: '0.75rem', mb: 1 }}>
                                    {errors.availability[day].slots[index].end.message}
                                  </Typography>
                                )}
                              </Grid>
                              <Grid item xs={2}>
                                <IconButton color="error" sx={{ ml: 3 }} onClick={() => removeSlot(day, index)}>
                                  <Icon icon="ion:trash-outline" />
                                </IconButton>
                              </Grid>
                            </Grid>
                          ))}
                          <Button onClick={() => addSlot(day)} sx={{ mt: 3 }} variant="outlined">
                            Add Slot
                          </Button>
                        </Box>
                      )}
                    />
                  </Box>
                </Grid>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
  
          <LoadingButton type="button" loading={isBackLoading} onClick={handleBackClick} variant="contained" color="inherit">
            Back
          </LoadingButton>
          <LoadingButton type="submit" variant="contained" loading={isNextLoading}>
            Next
          </LoadingButton>
        </Box>
      </form>
    </Container>
  );
}
