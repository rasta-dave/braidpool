import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Link,
  Chip,
} from '@mui/material';
import {
  formatTimestamp,
  formatBtcValue,
  truncateString,
} from './BlockTransactionsUtils';

export interface Transaction {
  txid: string;
  timestamp: number;
  size: number;
  weight: number;
  fee: number;
  value: number;
  inputs: number;
  outputs: number;
}

interface BlockTransactionsProps {
  transactions: Transaction[];
}

const BlockTransactions: React.FC<BlockTransactionsProps> = ({
  transactions,
}) => {
  if (!transactions || transactions.length === 0) {
    return (
      <Box mt={2}>
        <Typography variant="subtitle1">
          No transactions found in this block
        </Typography>
      </Box>
    );
  }

  return (
    <Box mt={3}>
      <Typography variant="h6" gutterBottom>
        Transactions ({transactions.length})
      </Typography>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>TX ID</TableCell>
              <TableCell>Time</TableCell>
              <TableCell align="right">Value</TableCell>
              <TableCell align="right">Fee</TableCell>
              <TableCell align="right">Size</TableCell>
              <TableCell align="right">In/Out</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.txid} hover>
                <TableCell>
                  <Link
                    href={`#/explorer/tx/${tx.txid}`}
                    sx={{
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {truncateString(tx.txid, 12)}
                  </Link>
                </TableCell>
                <TableCell>{formatTimestamp(tx.timestamp)}</TableCell>
                <TableCell align="right">{formatBtcValue(tx.value)}</TableCell>
                <TableCell align="right">{formatBtcValue(tx.fee)}</TableCell>
                <TableCell align="right">{tx.size} bytes</TableCell>
                <TableCell align="right">
                  <Chip
                    size="small"
                    color="primary"
                    label={`${tx.inputs}/${tx.outputs}`}
                    sx={{ minWidth: '60px' }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BlockTransactions;
