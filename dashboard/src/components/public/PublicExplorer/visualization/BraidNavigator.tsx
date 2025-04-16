import React, { useState } from 'react';
import {
  Box,
  Typography,
  Slider,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Grid,
  Paper,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBefore from '@mui/icons-material/NavigateBefore';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SpeedIcon from '@mui/icons-material/Speed';
import { BraidNavigatorProps, NavigationDirection } from './BraidTypes';

/**
 * A component that provides navigation controls for browsing through cohorts
 * in the braid visualization
 */
const BraidNavigator: React.FC<BraidNavigatorProps> = ({
  currentCohort,
  cohorts,
  onCohortChange,
  autoScroll,
  scrollSpeed,
  onAutoScrollChange,
  onScrollSpeedChange,
  position,
  onDragStart,
  transitionState,
  textColor,
  darkMode,
}) => {
  const [jumpToValue, setJumpToValue] = useState<string>('');

  // Navigation helper function
  const jumpToCohort = (direction: NavigationDirection) => {
    switch (direction) {
      case 'first':
        onCohortChange(0);
        break;
      case 'last':
        onCohortChange(cohorts.length - 1);
        break;
      case 'next':
        onCohortChange((currentCohort + 1) % cohorts.length);
        break;
      case 'prev':
        onCohortChange((currentCohort - 1 + cohorts.length) % cohorts.length);
        break;
      // The forward/back cases will be handled by the parent component
      case 'forward':
      case 'back':
        break;
    }
  };

  // Handle jump to specific cohort
  const handleJumpToCohort = () => {
    const value = parseInt(jumpToValue, 10);
    if (!isNaN(value) && value >= 0 && value < cohorts.length) {
      onCohortChange(value);
      console.log(`🚀 Jumped to cohort ${value}`);
    } else {
      console.log(`⚠️ Invalid cohort number: ${jumpToValue}`);
    }
    setJumpToValue('');
  };

  // Render drag handle
  const renderDragHandle = () => (
    <Box
      sx={{
        cursor: 'grab',
        position: 'absolute',
        top: 0,
        right: 0,
        p: 0.5,
        borderRadius: '0 4px 0 4px',
        backgroundColor: 'rgba(0,0,0,0.1)',
        '&:hover': {
          backgroundColor: 'rgba(0,0,0,0.2)',
        },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={(e) => onDragStart(e, 'navigation')}>
      <span style={{ fontSize: '14px', lineHeight: 1 }}>⋮⋮</span>
    </Box>
  );

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: 1000,
        p: 2,
        backgroundColor: darkMode
          ? 'rgba(30, 30, 30, 0.85)'
          : 'rgba(255, 255, 255, 0.85)',
        color: textColor,
        borderRadius: 1,
        boxShadow: 3,
        backdropFilter: 'blur(8px)',
        width: 320,
        maxWidth: '90vw',
      }}>
      {renderDragHandle()}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}>
        <Typography variant='subtitle2'>Cohort Navigation</Typography>
        <Typography variant='caption' sx={{ fontWeight: 'medium' }}>
          {currentCohort + 1}/{cohorts.length}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 2 }}>
        <Tooltip title='First Cohort'>
          <IconButton
            size='small'
            onClick={() => jumpToCohort('first')}
            disabled={currentCohort === 0 || transitionState.isTransitioning}
            sx={{ mx: 0.5 }}>
            <FirstPageIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title='Previous Cohort'>
          <IconButton
            size='small'
            onClick={() => jumpToCohort('prev')}
            disabled={transitionState.isTransitioning}
            sx={{ mx: 0.5 }}>
            <NavigateBefore />
          </IconButton>
        </Tooltip>

        <Tooltip title={autoScroll ? 'Pause Scrolling' : 'Auto Scroll'}>
          <IconButton
            size='small'
            color={autoScroll ? 'secondary' : 'default'}
            onClick={() => onAutoScrollChange(!autoScroll)}
            sx={{ mx: 0.5 }}>
            {autoScroll ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title='Next Cohort'>
          <IconButton
            size='small'
            onClick={() => jumpToCohort('next')}
            disabled={transitionState.isTransitioning}
            sx={{ mx: 0.5 }}>
            <NavigateNextIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title='Last Cohort'>
          <IconButton
            size='small'
            onClick={() => jumpToCohort('last')}
            disabled={
              currentCohort === cohorts.length - 1 ||
              transitionState.isTransitioning
            }
            sx={{ mx: 0.5 }}>
            <LastPageIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={1} alignItems='center'>
          <Grid item>
            <Typography variant='caption'>{0}</Typography>
          </Grid>
          <Grid item xs>
            <Slider
              value={currentCohort}
              onChange={(_, newValue) => onCohortChange(newValue as number)}
              min={0}
              max={cohorts.length - 1}
              valueLabelDisplay='auto'
              valueLabelFormat={(x) => cohorts[x].label}
              size='small'
              disabled={transitionState.isTransitioning}
            />
          </Grid>
          <Grid item>
            <Typography variant='caption'>{cohorts.length - 1}</Typography>
          </Grid>
        </Grid>
      </Box>

      {autoScroll && (
        <Box sx={{ mt: 1, mb: 3 }}>
          <Typography variant='caption' display='block' gutterBottom>
            Scroll Speed
          </Typography>
          <Grid container spacing={1} alignItems='center'>
            <Grid item>
              <SpeedIcon fontSize='small' />
            </Grid>
            <Grid item xs>
              <Slider
                value={scrollSpeed}
                onChange={(_, value) => onScrollSpeedChange(value as number)}
                min={0.5}
                max={5}
                step={0.5}
                marks={[
                  { value: 0.5, label: 'Fast' },
                  { value: 5, label: 'Slow' },
                ]}
                valueLabelDisplay='auto'
                valueLabelFormat={(x) => `${x}s`}
                size='small'
              />
            </Grid>
          </Grid>
        </Box>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant='caption' display='block' gutterBottom>
          Jump to Specific Cohort
        </Typography>
        <TextField
          size='small'
          placeholder='Enter cohort number'
          value={jumpToValue}
          onChange={(e) => setJumpToValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJumpToCohort()}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <IconButton
                  edge='end'
                  onClick={handleJumpToCohort}
                  disabled={!jumpToValue || transitionState.isTransitioning}
                  size='small'>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ width: '100%' }}
          disabled={transitionState.isTransitioning}
        />
      </Box>

      <Typography
        variant='body2'
        sx={{
          display: 'block',
          textAlign: 'center',
          mt: 2,
          fontWeight: 'medium',
        }}>
        Current: <strong>{cohorts[currentCohort].label}</strong> (
        {cohorts[currentCohort].nodes.length} nodes)
        {transitionState.isTransitioning && (
          <span>
            {' '}
            - Transitioning... {Math.round(transitionState.progress * 100)}%
          </span>
        )}
      </Typography>
    </Paper>
  );
};

export default BraidNavigator;
