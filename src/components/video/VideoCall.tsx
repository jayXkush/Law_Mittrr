import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, IconButton, Tooltip } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import CallEndIcon from '@mui/icons-material/CallEnd';

const SIGNAL_SERVER_URL = process.env.REACT_APP_SIGNAL_SERVER_URL || 'ws://localhost:8081';

interface VideoCallProps {
  open: boolean;
  onClose: () => void;
  room: string; // appointmentId or unique room id
  userId: string;
}

const VideoCall: React.FC<VideoCallProps> = ({ open, onClose, room, userId }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [connected, setConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);

  // Helper to get user media with current settings
  const getMediaStream = async (video = true, audio = true, facing: 'user' | 'environment' = 'user') => {
    return navigator.mediaDevices.getUserMedia({
      video: video ? { facingMode: facing } : false,
      audio
    });
  };

  // Helper to replace video track (for camera reverse or screen share)
  const replaceVideoTrack = (newTrack: MediaStreamTrack) => {
    if (!localStreamRef.current) return;
    const oldTrack = localStreamRef.current.getVideoTracks()[0];
    if (oldTrack) {
      localStreamRef.current.removeTrack(oldTrack);
      oldTrack.stop();
    }
    localStreamRef.current.addTrack(newTrack);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    // Replace track in peer connection
    if (pc) {
      const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) sender.replaceTrack(newTrack);
    }
  };


  useEffect(() => {
    if (!open) return;
    const wsConn = new window.WebSocket(SIGNAL_SERVER_URL);
    setWs(wsConn);
    const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    setPc(peer);

    let localStream: MediaStream;

    wsConn.onopen = () => {
      wsConn.send(JSON.stringify({ type: 'join', room, userId }));
    };

    wsConn.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'signal' && data.signal) {
        if (data.signal.sdp) {
          await peer.setRemoteDescription(new RTCSessionDescription(data.signal));
          if (data.signal.type === 'offer') {
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            wsConn.send(JSON.stringify({ type: 'signal', room, userId, signal: answer }));
          }
        } else if (data.signal.candidate) {
          await peer.addIceCandidate(new RTCIceCandidate(data.signal));
        }
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        wsConn.send(JSON.stringify({ type: 'signal', room, userId, signal: event.candidate }));
      }
    };

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    (async () => {
      try {
        localStream = await getMediaStream(true, true, facingMode);
        localStreamRef.current = localStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
        localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));
        // Only one peer should create offer (e.g., first to join room)
        if (userId.endsWith('1')) {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          wsConn.send(JSON.stringify({ type: 'signal', room, userId, signal: offer }));
        }
        setConnected(true);
      } catch (err) {
        alert('Could not access camera/mic');
        onClose();
      }
    })();

    return () => {
      wsConn.send(JSON.stringify({ type: 'leave', room, userId }));
      wsConn.close();
      peer.close();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      setConnected(false);
      setScreenSharing(false);
    };
    // eslint-disable-next-line
  }, [open, facingMode]);

  // Toggle mic
  const handleToggleMic = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = !micEnabled;
    });
    setMicEnabled((prev) => !prev);
  };

  // Toggle camera
  const handleToggleCam = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach(track => {
      track.enabled = !camEnabled;
    });
    setCamEnabled((prev) => !prev);
  };

  // Switch camera (front/back)
  const handleSwitchCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    // The effect will re-run and acquire the new camera
  };

  // Start/stop screen sharing
  const handleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;
        replaceVideoTrack(screenTrack);
        setScreenSharing(true);
        screenTrack.onended = () => {
          // When user stops sharing, revert to camera
          handleStopScreenShare();
        };
      } catch (err) {
        alert('Screen sharing failed.');
      }
    } else {
      handleStopScreenShare();
    }
  };

  const handleStopScreenShare = async () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    // Re-acquire camera
    try {
      const camStream = await getMediaStream(true, micEnabled, facingMode);
      const camTrack = camStream.getVideoTracks()[0];
      replaceVideoTrack(camTrack);
      setScreenSharing(false);
    } catch (err) {
      alert('Failed to restore camera.');
    }
  };

  // End call logic
  const handleEndCall = () => {
    if (ws) ws.close();
    if (pc) pc.close();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    setConnected(false);
    setScreenSharing(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleEndCall} maxWidth="md" fullWidth>
      <DialogTitle>Video Call</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="row" gap={2} justifyContent="center">
          <Box>
            <Typography variant="subtitle2">You</Typography>
            <video ref={localVideoRef} autoPlay muted playsInline style={{ width: 240, background: '#000' }} />
          </Box>
          <Box>
            <Typography variant="subtitle2">Lawyer</Typography>
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: 240, background: '#000' }} />
          </Box>
        </Box>
        {!connected && <Typography color="textSecondary">Connecting...</Typography>}
        <Box display="flex" justifyContent="center" gap={2} mt={2}>
          <Tooltip title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}>
            <IconButton onClick={handleToggleMic} color={micEnabled ? 'primary' : 'default'}>
              {micEnabled ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={camEnabled ? 'Turn Off Camera' : 'Turn On Camera'}>
            <IconButton onClick={handleToggleCam} color={camEnabled ? 'primary' : 'default'}>
              {camEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Switch Camera">
            <IconButton onClick={handleSwitchCamera} color="primary">
              <FlipCameraAndroidIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={screenSharing ? 'Stop Screen Share' : 'Share Screen'}>
            <IconButton onClick={handleScreenShare} color={screenSharing ? 'secondary' : 'primary'}>
              {screenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="End Call">
            <IconButton onClick={handleEndCall} color="error">
              <CallEndIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default VideoCall;
