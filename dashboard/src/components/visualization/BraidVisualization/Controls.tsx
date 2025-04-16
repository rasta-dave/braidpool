import React from 'react';
import {
  Box,
  Slider,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  Home,
  ArrowForward,
  ArrowBack,
  FirstPage,
  LastPage,
  NavigateNext,
  NavigateBefore,
  GridOn as GridOnIcon,
  Layers as LayersIcon,
  Stop as StopIcon,
} from '@mui/icons-material';

interface ControlsProps {
  totalCohorts: number;
  windowStart: number;
  windowSize: number;
  zoomLevel: number;
  layoutMode: 'force' | 'grid' | 'braid';
  simulationRunning: boolean;
  jumpToCohort: string;
  onWindowChange: (newValue: number) => void;
  onWindowSizeChange: (newValue: number) => void;
  onJumpToFirst: () => void;
  onJumpToLast: () => void;
  onJumpBack: () => void;
  onJumpForward: () => void;
  onJumpToCohort: () => void;
  onJumpToCohortChange: (value: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onLayoutModeChange: (mode: 'force' | 'grid' | 'braid') => void;
  onToggleSimulation: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  totalCohorts,
  windowStart,
  windowSize,
  zoomLevel,
  layoutMode,
  simulationRunning,
  jumpToCohort,
  onWindowChange,
  onWindowSizeChange,
  onJumpToFirst,
  onJumpToLast,
  onJumpBack,
  onJumpForward,
  onJumpToCohort,
  onJumpToCohortChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onLayoutModeChange,
  onToggleSimulation,
}) => {
  const windowEnd = Math.min(windowStart + windowSize, totalCohorts);
  const showingAll = totalCohorts <= windowSize;

  return (
    <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
      {/* Navigation controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <Tooltip title='First cohort'>
            <span>
              <IconButton
                onClick={onJumpToFirst}
                disabled={windowStart === 0 || totalCohorts === 0}
                size='small'>
                <FirstPage />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title='Previous cohorts'>
            <span>
              <IconButton
                onClick={onJumpBack}
                disabled={windowStart === 0 || totalCohorts === 0}
                size='small'>
                <NavigateBefore />
              </IconButton>
            </span>
          </Tooltip>

          <Box sx={{ mx: 1, flexGrow: 1 }}>
            <Slider
              value={windowStart}
              min={0}
              max={Math.max(0, totalCohorts - windowSize)}
              step={Math.max(1, Math.floor(windowSize / 5))}
              onChange={(_, newValue) => onWindowChange(newValue as number)}
              disabled={totalCohorts === 0 || showingAll}
              valueLabelDisplay='auto'
              valueLabelFormat={(value) =>
                `${value} - ${Math.min(value + windowSize, totalCohorts)}`
              }
            />
          </Box>

          <Tooltip title='Next cohorts'>
            <span>
              <IconButton
                onClick={onJumpForward}
                disabled={windowEnd >= totalCohorts || totalCohorts === 0}
                size='small'>
                <NavigateNext />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title='Last cohort'>
            <span>
              <IconButton
                onClick={onJumpToLast}
                disabled={windowEnd >= totalCohorts || totalCohorts === 0}
                size='small'>
                <LastPage />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        <TextField
          label='Jump to'
          size='small'
          value={jumpToCohort}
          onChange={(e) => onJumpToCohortChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onJumpToCohort()}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <IconButton
                  edge='end'
                  onClick={onJumpToCohort}
                  disabled={!jumpToCohort}
                  size='small'>
                  <ArrowForward />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ ml: 2, width: 120 }}
        />
      </Box>

      {/* Window size, zoom, and layout controls */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: 150, mr: 2 }}>
          <Slider
            value={windowSize}
            min={10}
            max={100}
            step={10}
            onChange={(_, newValue) => onWindowSizeChange(newValue as number)}
            disabled={totalCohorts === 0}
            valueLabelDisplay='auto'
            valueLabelFormat={(value) => `${value} cohorts`}
          />
        </Box>

        <Tooltip title='Zoom in'>
          <IconButton onClick={onZoomIn} size='small'>
            <ZoomIn />
          </IconButton>
        </Tooltip>

        <Tooltip title='Zoom out'>
          <IconButton onClick={onZoomOut} size='small'>
            <ZoomOut />
          </IconButton>
        </Tooltip>

        <Tooltip title='Reset zoom'>
          <IconButton onClick={onResetZoom} size='small'>
            <Home />
          </IconButton>
        </Tooltip>

        <Box sx={{ display: 'flex', ml: 2, alignItems: 'center' }}>
          <Tooltip title='Braid layout'>
            <IconButton
              onClick={() => onLayoutModeChange('braid')}
              color={layoutMode === 'braid' ? 'primary' : 'default'}
              size='small'>
              <LayersIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title='Grid layout'>
            <IconButton
              onClick={() => onLayoutModeChange('grid')}
              color={layoutMode === 'grid' ? 'primary' : 'default'}
              size='small'>
              <GridOnIcon />
            </IconButton>
          </Tooltip>

          <FormControlLabel
            control={
              <Switch
                checked={simulationRunning}
                onChange={onToggleSimulation}
                size='small'
              />
            }
            label='Simulation'
            sx={{ ml: 1 }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Controls;
