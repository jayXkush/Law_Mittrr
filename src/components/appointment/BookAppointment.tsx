import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  SelectChangeEvent,
  Stepper,
  Step,
  StepLabel,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import VideoCall from '../video/VideoCall';
import ShowVideoCallAtTime from './ShowVideoCallAtTime';

const BookAppointment = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    lawyerType: '',
    description: '',
    preferredMode: 'in-person',
    urgency: 'normal',
  });
  const [submitted, setSubmitted] = useState(false);
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  // For demo/testing: allow user to edit appointmentId (room) and userId
  const [appointmentId, setAppointmentId] = useState('demo-appointment');
  const [userId, setUserId] = useState('user1');

  const steps = ['Personal Details', 'Consultation Details', 'Review'];

  const lawyerTypes = [
    'Criminal Law',
    'Civil Law',
    'Corporate Law',
    'Family Law',
    'Property Law',
    'Tax Law',
    'Immigration Law',
    'Intellectual Property',
  ];

  const consultationModes = [
    { value: 'in-person', label: 'In-Person Meeting' },
    { value: 'video', label: 'Video Call' },
    { value: 'phone', label: 'Phone Call' },
  ];

  const urgencyLevels = [
    { value: 'urgent', label: 'Urgent (Within 24 hours)' },
    { value: 'normal', label: 'Normal (Within a week)' },
    { value: 'flexible', label: 'Flexible (Anytime)' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    switch (step) {
      case 0:
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.email) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email';
        }
        if (!formData.phone) {
          newErrors.phone = 'Phone number is required';
        } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
          newErrors.phone = 'Please enter a valid 10-digit phone number';
        }
        break;
      case 1:
        if (!formData.lawyerType) newErrors.lawyerType = 'Please select a legal service type';
        if (!formData.date) newErrors.date = 'Please select a preferred date';
        if (!formData.time) newErrors.time = 'Please select a preferred time';
        if (!formData.description) newErrors.description = 'Please provide a brief description';
        // Prevent past date/time
        if (formData.date && formData.time) {
          const now = new Date();
          const selected = new Date(`${formData.date}T${formData.time}`);
          if (selected < now) {
            newErrors.date = 'Date/time must be in the future';
            newErrors.time = 'Date/time must be in the future';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(activeStep)) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                variant="outlined"
                error={!!errors.name}
                helperText={errors.name}
                InputProps={{
                  sx: {
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                variant="outlined"
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  sx: {
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                variant="outlined"
                error={!!errors.phone}
                helperText={errors.phone}
                InputProps={{
                  sx: {
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                    },
                  },
                }}
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.lawyerType}>
                <InputLabel>Type of Legal Service</InputLabel>
                <Select
                  required
                  name="lawyerType"
                  value={formData.lawyerType}
                  onChange={handleSelectChange}
                  label="Type of Legal Service"
                >
                  {lawyerTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
                {errors.lawyerType && (
                  <Typography color="error" variant="caption" sx={{ mt: 1, ml: 2 }}>
                    {errors.lawyerType}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Preferred Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                error={!!errors.date}
                helperText={errors.date}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
                sx={{
                  '& input': {
                    padding: '16.5px 14px',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Preferred Time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                error={!!errors.time}
                helperText={errors.time}
                sx={{
                  '& input': {
                    padding: '16.5px 14px',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Consultation Mode</InputLabel>
                <Select
                  name="preferredMode"
                  value={formData.preferredMode}
                  onChange={handleSelectChange}
                  label="Consultation Mode"
                >
                  {consultationModes.map((mode) => (
                    <MenuItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Urgency Level</InputLabel>
                <Select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleSelectChange}
                  label="Urgency Level"
                >
                  {urgencyLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={4}
                label="Brief Description of Your Case"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                variant="outlined"
                error={!!errors.description}
                helperText={errors.description}
                placeholder="Please provide a brief overview of your legal matter..."
                InputProps={{
                  sx: {
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                    },
                  },
                }}
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Review Your Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" color="primary">Personal Details</Typography>
                <Typography>Name: {formData.name}</Typography>
                <Typography>Email: {formData.email}</Typography>
                <Typography>Phone: {formData.phone}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" color="primary">Consultation Details</Typography>
                <Typography>Service Type: {formData.lawyerType}</Typography>
                <Typography>Date: {formData.date}</Typography>
                <Typography>Time: {formData.time}</Typography>
                <Typography>Mode: {formData.preferredMode}</Typography>
                <Typography>Urgency: {formData.urgency}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" color="primary">Case Description</Typography>
                <Typography>{formData.description}</Typography>
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  if (submitted) {
    return (
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper elevation={3} sx={{ p: 4, mt: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom color="primary">
              Consultation Request Submitted!
            </Typography>
            <Typography variant="body1" paragraph>
              Thank you for booking a consultation. We will contact you shortly to confirm your appointment.
            </Typography>
            <Alert severity="success" sx={{ mt: 2 }}>
              A confirmation email has been sent to {formData.email}
            </Alert>
          </Paper>


        {/* Only show video call option at or after scheduled time */}
        <ShowVideoCallAtTime
          preferredMode={formData.preferredMode}
          date={formData.date}
          time={formData.time}
          appointmentId={appointmentId}
          userId={userId}
        />
      </motion.div>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h4" gutterBottom align="center" sx={{
            background: 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 4
          }}>
            Book Your Legal Consultation
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <form onSubmit={handleSubmit}>
            {getStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              {activeStep !== 0 && (
                <Button 
                  onClick={handleBack}
                  sx={{
                    mr: 1,
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'rgba(37, 99, 235, 0.04)',
                    },
                  }}
                >
                  Back
                </Button>
              )}
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1E40AF 0%, #0284C7 100%)',
                    },
                    minWidth: 200,
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Consultation Request'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{
                    background: 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1E40AF 0%, #0284C7 100%)',
                    },
                    minWidth: 100,
                  }}
                >
                  Next
                </Button>
              )}
            </Box>
          </form>
        </Paper>
      </motion.div>

    </Container>
  );
};

export default BookAppointment;
