import React, { useEffect, useState } from 'react';
import { Button, Box } from '@mui/material';
import VideoCall from '../video/VideoCall';

interface ShowVideoCallAtTimeProps {
  preferredMode: string;
  date: string;
  time: string;
  appointmentId: string;
  userId: string;
}

const ShowVideoCallAtTime: React.FC<ShowVideoCallAtTimeProps> = ({ preferredMode, date, time, appointmentId, userId }) => {
  const [show, setShow] = useState(false);
  const [videoCallOpen, setVideoCallOpen] = useState(false);

  useEffect(() => {
    if (preferredMode !== 'video' || !date || !time) {
      setShow(false);
      return;
    }
    // Combine date and time into a JS Date object
    const appointmentDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    if (now >= appointmentDateTime) {
      setShow(true);
      return;
    }
    // Set a timer to show at the correct time
    const timeout = appointmentDateTime.getTime() - now.getTime();
    const timer = setTimeout(() => setShow(true), Math.max(timeout, 0));
    return () => clearTimeout(timer);
  }, [preferredMode, date, time]);

  if (!show) return null;

  return (
    <>
      <Box textAlign="center" mt={4}>
        <Button variant="contained" color="primary" onClick={() => setVideoCallOpen(true)}>
          Join Video Call
        </Button>
      </Box>
      <VideoCall
        open={videoCallOpen}
        onClose={() => setVideoCallOpen(false)}
        room={appointmentId}
        userId={userId}
      />
    </>
  );
};

export default ShowVideoCallAtTime;
