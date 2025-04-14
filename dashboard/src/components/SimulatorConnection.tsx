import React, { useEffect, useState } from 'react';
import useSimulatorWebSocket from '../hooks/useSimulatorWebSocket';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import RefreshIcon from '@mui/icons-material/Refresh';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import PowerIcon from '@mui/icons-material/Power';
import ErrorIcon from '@mui/icons-material/Error';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

interface SimulatorConnectionProps {
  autoConnect?: boolean;
}

const SimulatorConnection: React.FC<SimulatorConnectionProps> = ({
  autoConnect = true,
}) => {
  // Check if mock data is enabled
  const [useMockData, setUseMockData] = useState(() => {
    const storedPreference = localStorage.getItem('useMockData');
    return (
      storedPreference === 'true' ||
      import.meta.env.VITE_USE_MOCK_DATA === 'true'
    );
  });

  const { status, data, error, connect, disconnect } = useSimulatorWebSocket({
    autoConnect: autoConnect && !useMockData,
    fallbackToMock: true,
  });

  const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);
  const [showData, setShowData] = useState(false);

  // Update last message time when data changes
  useEffect(() => {
    if (data) {
      setLastMessageTime(new Date());
    }
  }, [data]);

  // Handle mock data toggle
  const handleToggleMockData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const useMock = event.target.checked;
    setUseMockData(useMock);
    localStorage.setItem('useMockData', String(useMock));

    // Disconnect WebSocket if we're switching to mock mode
    if (useMock) {
      disconnect();
    } else {
      // Connect if switching to real data
      connect();
    }
  };

  const renderStatusIcon = () => {
    if (useMockData) {
      return <WifiOffIcon />;
    }

    switch (status) {
      case 'connected':
        return <WifiIcon />;
      case 'connecting':
        return <CircularProgress size={20} />;
      case 'disconnected':
        return <WifiOffIcon />;
      case 'error':
        return <ErrorIcon />;
      default:
        return <WifiOffIcon />;
    }
  };

  const getStatusText = () => {
    if (useMockData) {
      return 'Using Mock Data';
    }

    switch (status) {
      case 'connected':
        return 'Connected to simulator';
      case 'connecting':
        return 'Connecting to simulator...';
      case 'disconnected':
        return 'Disconnected from simulator';
      case 'error':
        return 'Connection error';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    if (useMockData) {
      return 'info';
    }

    switch (status) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'info';
      case 'disconnected':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6' sx={{ flexGrow: 1 }}>
          Simulator Connection
        </Typography>

        {/* Mock data toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={useMockData}
              onChange={handleToggleMockData}
              color='primary'
            />
          }
          label='Use Mock Data'
          sx={{ mr: 2 }}
        />

        <Chip
          icon={renderStatusIcon()}
          label={getStatusText()}
          color={getStatusColor() as any}
          variant='outlined'
          sx={{ mr: 2 }}
        />

        {!useMockData && (status === 'connected' || status === 'connecting') ? (
          <Button
            variant='outlined'
            color='warning'
            startIcon={<PowerIcon />}
            onClick={disconnect}
            size='small'>
            Disconnect
          </Button>
        ) : !useMockData ? (
          <Button
            variant='contained'
            color='primary'
            startIcon={<RefreshIcon />}
            onClick={connect}
            size='small'>
            Connect
          </Button>
        ) : null}
      </Box>

      {error && !useMockData && (
        <Alert severity='warning' sx={{ mb: 2 }}>
          <strong>WebSocket connection error:</strong> {error.message}
          <Box sx={{ mt: 1 }}>
            Consider using mock data if the WebSocket server is unavailable.
          </Box>
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant='subtitle2' color='textSecondary' gutterBottom>
          Last Message Received:
        </Typography>
        <Typography>
          {lastMessageTime
            ? lastMessageTime.toLocaleTimeString()
            : 'No messages received yet'}
        </Typography>
      </Box>

      {data && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant='subtitle2' color='textSecondary'>
              Latest Data:
            </Typography>
            <Button
              size='small'
              sx={{ ml: 2 }}
              onClick={() => setShowData(!showData)}>
              {showData ? 'Hide' : 'Show'} Data
            </Button>
          </Box>

          {showData && (
            <Box
              component='pre'
              sx={{
                backgroundColor: 'background.paper',
                p: 1,
                borderRadius: 1,
                overflow: 'auto',
                maxHeight: 300,
                border: '1px solid',
                borderColor: 'divider',
              }}>
              {JSON.stringify(data, null, 2)}
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default SimulatorConnection;
