import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { BraidLegendProps } from './BraidTypes';

/**
 * A legend component that explains the different elements in the braid visualization
 */
const BraidLegend: React.FC<BraidLegendProps> = ({
  position,
  onDragStart,
  showHighWorkPath,
  colors,
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
      onMouseDown={(e) => onDragStart(e, 'legend')}>
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
        color: colors.textColor,
        borderRadius: 1,
        boxShadow: 3,
        backdropFilter: 'blur(8px)',
        width: 220,
        maxWidth: '90vw',
      }}>
      {renderDragHandle()}

      <Typography
        variant='subtitle2'
        gutterBottom
        sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <InfoOutlinedIcon
          fontSize='small'
          sx={{ verticalAlign: 'middle', mr: 1 }}
        />
        Legend
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: colors.nodeColors[0],
              border: `1px solid ${colors.nodeStrokeColor}`,
              mr: 1.5,
            }}
          />
          <Typography variant='body2'>Regular Nodes (by Cohort)</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: colors.nodeColors[6],
              border: `2px solid ${colors.tipNodeStrokeColor}`,
              mr: 1.5,
            }}
          />
          <Typography variant='body2'>Tip Nodes (Latest)</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: colors.nodeColors[5],
              border: `2px solid ${colors.highlightColor}`,
              mr: 1.5,
            }}
          />
          <Typography variant='body2'>Currently Selected Cohort</Typography>
        </Box>

        {showHighWorkPath && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: colors.highWorkPathColor,
                border: `1px solid ${colors.nodeStrokeColor}`,
                mr: 1.5,
              }}
            />
            <Typography variant='body2'>Highest Work Path</Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default BraidLegend;
