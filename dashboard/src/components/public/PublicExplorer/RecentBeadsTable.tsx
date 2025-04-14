import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  TablePagination,
  Link as MuiLink,
} from '@mui/material';
import { Link } from 'react-router-dom';
import publicApiClient from '../../../api/public/client';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

interface RecentBeadsTableProps {
  limit?: number;
}

const RecentBeadsTable: React.FC<RecentBeadsTableProps> = ({ limit = 10 }) => {
  const [beads, setBeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchRecentBeads = async () => {
      try {
        setLoading(true);
        const data = await publicApiClient.getRecentBeads(limit);
        setBeads(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching recent beads:', err);
        setError(`Failed to load recent beads: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentBeads();

    // Set up polling interval for real-time updates
    const intervalId = setInterval(fetchRecentBeads, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, [limit]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format timestamp to readable format
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  // Format time ago
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now() / 1000;
    const seconds = Math.floor(now - timestamp);

    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  // Truncate hash for display
  const truncateHash = (hash: string) => {
    if (!hash) return '';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}`;
  };

  if (loading && beads.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && beads.length === 0) {
    return (
      <Typography color='error' sx={{ p: 2 }}>
        {error}
      </Typography>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Typography
        variant='h6'
        sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        Recent Beads
      </Typography>

      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label='recent beads table'>
          <TableHead>
            <TableRow>
              <TableCell>Bead Hash</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Miner</TableCell>
              <TableCell align='right'>Work Value</TableCell>
              <TableCell align='right'>Transactions</TableCell>
              <TableCell align='center'>Cohort</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {beads
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((bead) => (
                <TableRow hover key={bead.beadHash}>
                  <TableCell>
                    <MuiLink
                      component={Link}
                      to={`/explorer/bead/${bead.beadHash}`}
                      sx={{ fontFamily: 'monospace' }}>
                      {truncateHash(bead.beadHash)}
                    </MuiLink>
                  </TableCell>
                  <TableCell title={formatTimestamp(bead.timestamp)}>
                    {formatTimeAgo(bead.timestamp)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={bead.miner}
                      size='small'
                      sx={{
                        bgcolor:
                          bead.miner === 'MinerA'
                            ? 'rgba(33, 150, 243, 0.1)'
                            : bead.miner === 'MinerB'
                            ? 'rgba(76, 175, 80, 0.1)'
                            : bead.miner === 'MinerC'
                            ? 'rgba(255, 152, 0, 0.1)'
                            : 'rgba(156, 39, 176, 0.1)',
                        borderRadius: '4px',
                      }}
                    />
                  </TableCell>
                  <TableCell align='right'>{bead.workValue}</TableCell>
                  <TableCell align='right'>{bead.transactionCount}</TableCell>
                  <TableCell align='center'>
                    {bead.formsCohort ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label={`Forms (${bead.beadsInCohort})`}
                        size='small'
                        color='success'
                        variant='outlined'
                      />
                    ) : (
                      <Chip
                        icon={<RemoveCircleIcon />}
                        label='No'
                        size='small'
                        color='default'
                        variant='outlined'
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component='div'
        count={beads.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default RecentBeadsTable;
