import React from 'react';
import {
  Box,
  Typography,
  Slider,
  FormControlLabel,
  Switch,
  Grid,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import HomeIcon from '@mui/icons-material/Home';
import LayersIcon from '@mui/icons-material/Layers';
import GridOnIcon from '@mui/icons-material/GridOn';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import { BraidControlsProps, LayoutMode } from './BraidTypes';

/**
 * A component providing controls for the braid visualization settings
 * such as zoom, layout mode, and display options
 */
const BraidControls: React.FC<BraidControlsProps> = ({
  showDetails,
  onShowDetailsChange,
  showMinimap,
  onShowMinimapChange,
  showHighWorkPath,
  onShowHighWorkPathChange,
  zoomLevel,
  onZoomChange,
  layoutMode,
  onLayoutChange,
  windowSize,
  onWindowSizeChange,
  position,
  onDragStart,
  textColor,
  darkMode,
}) => {
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
      onMouseDown={(e) => onDragStart(e, 'controls')}>
      <span style={{ fontSize: '14px', lineHeight: 1 }}>⋮⋮</span>
    </Box>
  );

  // Handle layout mode changes
  const handleLayoutChange = (
    event: React.MouseEvent<HTMLElement>,
    newLayout: LayoutMode | null
  ) => {
    if (newLayout !== null) {
      onLayoutChange(newLayout);
      console.log(`📊 Changed layout to ${newLayout} mode`);
    }
  };

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
        width: 270,
        maxWidth: '90vw',
      }}>
      {renderDragHandle()}

      <Typography variant='subtitle2' gutterBottom sx={{ mb: 2 }}>
        Visualization Controls
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant='caption' gutterBottom display='block'>
          Zoom Level: {zoomLevel}%
        </Typography>
        <Grid container spacing={1.5} alignItems='center'>
          <Grid item>
            <Tooltip title='Zoom out'>
              <IconButton
                onClick={() => onZoomChange(Math.max(10, zoomLevel - 10))}
                size='small'>
                <ZoomOutIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item xs>
            <Slider
              value={zoomLevel}
              min={10}
              max={200}
              step={10}
              onChange={(_, value) => onZoomChange(value as number)}
              valueLabelDisplay='auto'
              valueLabelFormat={(x) => `${x}%`}
              size='small'
            />
          </Grid>
          <Grid item>
            <Tooltip title='Zoom in'>
              <IconButton
                onClick={() => onZoomChange(Math.min(200, zoomLevel + 10))}
                size='small'>
                <ZoomInIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item>
            <Tooltip title='Reset zoom'>
              <IconButton onClick={() => onZoomChange(100)} size='small'>
                <HomeIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mt: 2, mb: 3 }}>
        <Typography variant='caption' gutterBottom display='block'>
          Layout Mode
        </Typography>
        <ToggleButtonGroup
          value={layoutMode}
          exclusive
          onChange={handleLayoutChange}
          size='small'
          sx={{ mb: 1, width: '100%' }}>
          <ToggleButton value='braid' sx={{ flex: 1 }}>
            <Tooltip title='Braid layout'>
              <LayersIcon fontSize='small' />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value='grid' sx={{ flex: 1 }}>
            <Tooltip title='Grid layout'>
              <GridOnIcon fontSize='small' />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value='force' sx={{ flex: 1 }}>
            <Tooltip title='Force layout'>
              <ViewInArIcon fontSize='small' />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Typography variant='caption' gutterBottom display='block'>
        Display Options
      </Typography>
      <Grid container spacing={1.5} sx={{ mt: 0.5, mb: 3 }}>
        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Switch
                checked={showDetails}
                onChange={(e) => onShowDetailsChange(e.target.checked)}
                size='small'
              />
            }
            label={<Typography variant='body2'>Details</Typography>}
          />
        </Grid>

        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Switch
                checked={showMinimap}
                onChange={(e) => onShowMinimapChange(e.target.checked)}
                size='small'
              />
            }
            label={<Typography variant='body2'>Minimap</Typography>}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={showHighWorkPath}
                onChange={(e) => onShowHighWorkPathChange(e.target.checked)}
                size='small'
              />
            }
            label={<Typography variant='body2'>Work Path</Typography>}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 1 }}>
        <Typography variant='caption' gutterBottom display='block'>
          Cohort Window Size
        </Typography>
        <Slider
          value={windowSize}
          min={1}
          max={5}
          step={1}
          marks
          onChange={(_, value) => onWindowSizeChange(value as number)}
          valueLabelDisplay='auto'
          size='small'
        />
      </Box>
    </Paper>
  );
};

export default BraidControls;
