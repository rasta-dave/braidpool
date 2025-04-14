import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Alert,
  Divider,
} from '@mui/material';
import Card from '../../common/Card';
import { Bead } from '../../../types/Bead';
import publicApiClient from '../../../api/public/client';
import { useParams, Link } from 'react-router-dom';

interface BeadExplorerProps {
  searchResults?: Bead[];
  searchQuery?: string;
  loading?: boolean;
  error?: string | null;
  standalone?: boolean;
}

const BeadExplorer: React.FC<BeadExplorerProps> = ({
  searchResults = [],
  searchQuery = '',
  loading = false,
  error = null,
  standalone = false,
}) => {
  const { beadHash: urlBeadHash } = useParams<{ beadHash: string }>();
  const [selectedBead, setSelectedBead] = useState<Bead | null>(null);
  const [loadingBead, setLoadingBead] = useState(false);
  const [beadError, setBeadError] = useState<string | null>(null);

  // If in standalone mode, load the bead from the URL param
  useEffect(() => {
    if (standalone && urlBeadHash) {
      handleViewBead(urlBeadHash);
    }
  }, [standalone, urlBeadHash]);

  // Function to view a specific bead
  const handleViewBead = async (beadHash: string) => {
    try {
      console.log(`🔍 Viewing bead: ${beadHash}`);
      setLoadingBead(true);
      setBeadError(null);

      const bead = await publicApiClient.getBeadByHash(beadHash);
      setSelectedBead(bead);
    } catch (err: any) {
      console.error(`❌ Error fetching bead ${beadHash}:`, err);
      setBeadError(`Failed to load bead: ${err.message || 'Unknown error'}`);
    } finally {
      setLoadingBead(false);
    }
  };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Truncate hash for display
  const truncateHash = (hash: string, length = 10): string => {
    if (hash.length <= length * 2) return hash;
    return `${hash.substring(0, length)}...${hash.substring(
      hash.length - length
    )}`;
  };

  // Render the search results table
  const renderSearchResults = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    if (searchResults.length === 0) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography variant='body1'>
            {searchQuery
              ? `No beads found matching "${searchQuery}"`
              : 'Enter a search term to find beads'}
          </Typography>
        </Box>
      );
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Bead Hash</TableCell>
              <TableCell>Timestamp</TableCell>
              <TableCell>Parents</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {searchResults.map((bead) => (
              <TableRow key={bead.beadHash}>
                <TableCell>
                  <Typography variant='body2' sx={{ fontFamily: 'monospace' }}>
                    {truncateHash(bead.beadHash)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {formatTimestamp(bead.blockHeader.timestamp)}
                </TableCell>
                <TableCell>{bead.parents.length}</TableCell>
                <TableCell>
                  <Button
                    variant='outlined'
                    size='small'
                    onClick={() => handleViewBead(bead.beadHash)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Render the selected bead details
  const renderBeadDetails = () => {
    if (!selectedBead && !loadingBead && !beadError) {
      if (standalone) {
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading bead details...</Typography>
          </Box>
        );
      }
      return null;
    }

    return (
      <Box sx={{ mt: standalone ? 0 : 3 }}>
        {!standalone && <Divider sx={{ mb: 3 }} />}

        {standalone && (
          <Box sx={{ mb: 3 }}>
            <Button component={Link} to='/explorer' variant='outlined'>
              ← Back to Explorer
            </Button>
          </Box>
        )}

        <Typography variant='h6' sx={{ mb: 2 }}>
          {standalone ? 'Bead Information' : 'Bead Details'}
        </Typography>

        {beadError && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {beadError}
          </Alert>
        )}

        {loadingBead ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : selectedBead ? (
          <Box>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant='subtitle1' color='primary' sx={{ mb: 1 }}>
                Basic Information
              </Typography>

              <Box sx={{ mb: 1 }}>
                <Typography
                  variant='body2'
                  component='span'
                  sx={{ fontWeight: 'bold' }}>
                  Bead Hash:
                </Typography>
                <Typography
                  variant='body2'
                  component='span'
                  sx={{
                    ml: 1,
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                  }}>
                  {selectedBead.beadHash}
                </Typography>
              </Box>

              <Box sx={{ mb: 1 }}>
                <Typography
                  variant='body2'
                  component='span'
                  sx={{ fontWeight: 'bold' }}>
                  Timestamp:
                </Typography>
                <Typography variant='body2' component='span' sx={{ ml: 1 }}>
                  {formatTimestamp(selectedBead.blockHeader.timestamp)}
                </Typography>
              </Box>

              <Box sx={{ mb: 1 }}>
                <Typography
                  variant='body2'
                  component='span'
                  sx={{ fontWeight: 'bold' }}>
                  Observed Time:
                </Typography>
                <Typography variant='body2' component='span' sx={{ ml: 1 }}>
                  {formatTimestamp(selectedBead.observedTimeAtNode)}
                </Typography>
              </Box>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant='subtitle1' color='primary' sx={{ mb: 1 }}>
                Parents ({selectedBead.parents.length})
              </Typography>

              {selectedBead.parents.length > 0 ? (
                selectedBead.parents.map((parent, index) => (
                  <Chip
                    key={index}
                    label={truncateHash(parent.beadHash)}
                    onClick={() => handleViewBead(parent.beadHash)}
                    sx={{ m: 0.5, fontFamily: 'monospace' }}
                  />
                ))
              ) : (
                <Typography variant='body2'>
                  Genesis bead (no parents)
                </Typography>
              )}
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant='subtitle1' color='primary' sx={{ mb: 1 }}>
                Transactions ({selectedBead.transactions.length})
              </Typography>

              {selectedBead.transactions.length > 0 ? (
                <TableContainer>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Transaction ID</TableCell>
                        <TableCell>Size</TableCell>
                        <TableCell>Weight</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedBead.transactions.map((tx, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography
                              variant='body2'
                              sx={{ fontFamily: 'monospace' }}>
                              {truncateHash(tx.txid)}
                            </Typography>
                          </TableCell>
                          <TableCell>{tx.size} bytes</TableCell>
                          <TableCell>{tx.weight}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant='body2'>
                  No transactions in this bead
                </Typography>
              )}
            </Paper>
          </Box>
        ) : null}
      </Box>
    );
  };

  return (
    <Box>
      {!standalone && (
        <Card title='Bead Explorer'>{renderSearchResults()}</Card>
      )}

      {renderBeadDetails()}
    </Box>
  );
};

export default BeadExplorer;
