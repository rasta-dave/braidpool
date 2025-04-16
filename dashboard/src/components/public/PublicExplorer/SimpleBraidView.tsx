import React from 'react';
import { Box, Typography, Paper, Divider, Chip } from '@mui/material';
import { BraidVisualizationData } from '../../../types/braid';

interface SimpleBraidViewProps {
  data: BraidVisualizationData | null;
}

/**
 * A simplified component for displaying braid data structure
 * Useful for debugging when complex visualization fails
 */
const SimpleBraidView: React.FC<SimpleBraidViewProps> = ({ data }) => {
  if (!data) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No visualization data available</Typography>
      </Box>
    );
  }

  // Format the cohort data for display
  const formatCohorts = () => {
    return data.cohorts.slice(0, 5).map((cohort, index) => (
      <Box
        key={index}
        sx={{ mb: 2, p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
        <Typography variant='subtitle2' sx={{ mb: 1 }}>
          Cohort {index} ({cohort.length} nodes)
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {cohort.slice(0, 10).map((nodeId) => (
            <Chip key={nodeId} label={nodeId} size='small' />
          ))}
          {cohort.length > 10 && (
            <Chip
              label={`+${cohort.length - 10} more`}
              size='small'
              variant='outlined'
            />
          )}
        </Box>
      </Box>
    ));
  };

  // Show sample nodes
  const formatSampleNodes = () => {
    return data.nodes.slice(0, 5).map((node) => (
      <Box
        key={node.id}
        sx={{ mb: 2, p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
        <Typography variant='subtitle2' gutterBottom>
          Node ID: {node.id} (Cohort {node.cohort})
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Typography variant='body2' sx={{ mr: 1 }}>
            Parents:
          </Typography>
          {node.parents.length === 0 ? (
            <Chip label='None (Genesis)' size='small' color='primary' />
          ) : (
            node.parents.map((parentId) => (
              <Chip key={parentId} label={parentId} size='small' />
            ))
          )}
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant='body2' sx={{ mr: 1 }}>
            Children:
          </Typography>
          {node.children.length === 0 ? (
            <Chip label='None (Tip)' size='small' color='secondary' />
          ) : (
            node.children
              .slice(0, 5)
              .map((childId) => (
                <Chip key={childId} label={childId} size='small' />
              ))
          )}
          {node.children.length > 5 && (
            <Chip
              label={`+${node.children.length - 5} more`}
              size='small'
              variant='outlined'
            />
          )}
        </Box>
      </Box>
    ));
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant='h6' gutterBottom>
        Simple Braid Visualization
      </Typography>
      <Typography variant='body2' color='text.secondary' paragraph>
        This is a simplified text-based visualization of the braid structure for
        debugging purposes.
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Chip label={`${data.nodes.length} Nodes`} color='primary' />
        <Chip
          label={`${data.links.length} Links`}
          color='primary'
          variant='outlined'
        />
        <Chip label={`${data.cohorts.length} Cohorts`} color='secondary' />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant='subtitle1' gutterBottom>
        Sample Cohorts (first 5)
      </Typography>
      {formatCohorts()}

      <Divider sx={{ my: 2 }} />

      <Typography variant='subtitle1' gutterBottom>
        Sample Nodes (first 5)
      </Typography>
      {formatSampleNodes()}
    </Paper>
  );
};

export default SimpleBraidView;
