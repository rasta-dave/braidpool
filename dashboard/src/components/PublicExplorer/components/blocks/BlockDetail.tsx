import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Paper,
  Typography,
  Chip,
  Tooltip,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  formatTimestamp,
  formatBtcValue,
  truncateString,
  formatFileSize,
  formatDifficulty,
  timeAgo,
} from '../../utils';
import BlockTransactions from './BlockTransactions';
import { BraidTransaction } from '../transactions/BraidTransaction';
import { formatDistanceToNow } from 'date-fns';

export interface Transaction {
  txid: string;
  timestamp: number;
  size: number;
  weight: number;
  fee: number;
  value: number;
  inputs?: any[];
  outputs?: any[];
}

export interface Block {
  hash: string;
  height: number;
  timestamp: number;
  difficulty: number;
  merkleRoot: string;
  nonce: number;
  bits: string;
  size: number;
  weight: number;
  version: number;
  confirmations: number;
  transactions: Transaction[];
  fees: number;
  previousBlockHash?: string;
  nextBlockHash?: string;
}

interface BlockDetailProps {
  block: Block;
  isLoading?: boolean;
  error?: string;
}

const BlockDetail: React.FC<BlockDetailProps> = ({
  block,
  isLoading = false,
  error,
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading block details: {error}
      </Alert>
    );
  }

  // Format timestamp to human-readable time
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  // Format time from now
  const formatTimeAgo = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Format size in KB
  const formatSize = (size: number): string => {
    return `${(size / 1024).toFixed(2)} KB`;
  };

  // Format satoshis to BTC
  const formatBTC = (satoshis: number): string => {
    return `${(satoshis / 100000000).toFixed(8)} BTC`;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Block #{block.height}
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            spacing={2}
            direction={{ xs: 'column', sm: 'row' }}
            flexWrap="wrap"
          >
            <Box sx={{ width: { xs: '100%', md: '48%' } }}>
              <Typography variant="subtitle1" color="text.secondary">
                Block Hash
              </Typography>
              <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                {block.hash}
              </Typography>
            </Box>

            <Box sx={{ width: { xs: '100%', md: '48%' } }}>
              <Typography variant="subtitle1" color="text.secondary">
                Timestamp
              </Typography>
              <Typography variant="body1">
                {formatTimestamp(block.timestamp)}
                <Chip
                  size="small"
                  label={formatTimeAgo(block.timestamp)}
                  sx={{ ml: 1, fontSize: '0.75rem' }}
                />
              </Typography>
            </Box>

            <Box sx={{ width: { xs: '48%', md: '23%' } }}>
              <Typography variant="subtitle1" color="text.secondary">
                Size
              </Typography>
              <Typography variant="body1">{formatSize(block.size)}</Typography>
            </Box>

            <Box sx={{ width: { xs: '48%', md: '23%' } }}>
              <Typography variant="subtitle1" color="text.secondary">
                Weight
              </Typography>
              <Typography variant="body1">
                {(block.weight / 1000).toFixed(2)} kWU
              </Typography>
            </Box>

            <Box sx={{ width: { xs: '48%', md: '23%' } }}>
              <Typography variant="subtitle1" color="text.secondary">
                Confirmations
              </Typography>
              <Typography variant="body1">{block.confirmations}</Typography>
            </Box>

            <Box sx={{ width: { xs: '48%', md: '23%' } }}>
              <Typography variant="subtitle1" color="text.secondary">
                Difficulty
              </Typography>
              <Typography variant="body1">
                {block.difficulty.toLocaleString()}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack
            spacing={2}
            direction={{ xs: 'column', sm: 'row' }}
            flexWrap="wrap"
          >
            <Box sx={{ width: { xs: '100%', md: '48%' } }}>
              <Typography variant="subtitle1" color="text.secondary">
                Merkle Root
              </Typography>
              <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                {block.merkleRoot}
              </Typography>
            </Box>

            <Box sx={{ width: { xs: '100%', md: '48%' } }}>
              <Typography variant="subtitle1" color="text.secondary">
                Previous Block
              </Typography>
              <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                {block.previousBlockHash || 'Genesis Block'}
              </Typography>
            </Box>

            <Box sx={{ width: { xs: '48%', md: '23%' } }}>
              <Typography variant="subtitle1" color="text.secondary">
                Version
              </Typography>
              <Typography variant="body1">{block.version}</Typography>
            </Box>

            <Box sx={{ width: { xs: '48%', md: '23%' } }}>
              <Typography variant="subtitle1" color="text.secondary">
                Bits
              </Typography>
              <Typography variant="body1">{block.bits}</Typography>
            </Box>

            <Box sx={{ width: { xs: '48%', md: '23%' } }}>
              <Typography variant="subtitle1" color="text.secondary">
                Nonce
              </Typography>
              <Typography variant="body1">
                {block.nonce.toLocaleString()}
              </Typography>
            </Box>

            <Box sx={{ width: { xs: '48%', md: '23%' } }}>
              <Typography variant="subtitle1" color="text.secondary">
                Total Fees
              </Typography>
              <Typography variant="body1">{formatBTC(block.fees)}</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="h5" gutterBottom>
        Transactions ({block.transactions.length})
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Transaction ID</TableCell>
              <TableCell align="right">Size</TableCell>
              <TableCell align="right">Weight</TableCell>
              <TableCell align="right">Fee</TableCell>
              <TableCell align="right">Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {block.transactions.map((tx) => (
              <TableRow key={tx.txid} hover>
                <TableCell sx={{ wordBreak: 'break-all' }}>{tx.txid}</TableCell>
                <TableCell align="right">{formatSize(tx.size)}</TableCell>
                <TableCell align="right">
                  {(tx.weight / 1000).toFixed(2)} kWU
                </TableCell>
                <TableCell align="right">
                  {(tx.fee / 100000000).toFixed(8)} BTC
                </TableCell>
                <TableCell align="right">{formatBTC(tx.value)}</TableCell>
              </TableRow>
            ))}
            {block.transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No transactions in this block
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BlockDetail;
