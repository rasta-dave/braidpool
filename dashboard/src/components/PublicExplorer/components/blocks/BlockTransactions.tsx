import React from 'react';
import { Link } from 'react-router-dom';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from '@mui/material';
import { formatTimestamp, formatBtcValue, formatFileSize } from '../../utils';

interface Transaction {
  txid: string;
  timestamp: number;
  size: number;
  fee: number;
  vin?: any[];
  vout?: any[];
}

interface BlockTransactionsProps {
  transactions: Transaction[];
}

const BlockTransactions: React.FC<BlockTransactionsProps> = ({
  transactions,
}) => {
  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
            Transactions ({transactions.length})
          </Typography>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ bgcolor: 'background.default' }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>TX ID</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell align="right">Fee</TableCell>
                  <TableCell align="right">Size</TableCell>
                  <TableCell align="center">In/Out</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.txid} hover>
                    <TableCell>
                      <Typography
                        component={Link}
                        to={`/tx/${tx.txid}`}
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'none',
                          fontFamily: 'monospace',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {tx.txid.slice(0, 16)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={formatTimestamp(tx.timestamp)}>
                        <Typography variant="body2" color="text.secondary">
                          {formatTimestamp(tx.timestamp, true)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontFamily="monospace" fontWeight="medium">
                        {formatBtcValue(tx.fee * 100)}{' '}
                        {/* Using fee as a placeholder for value */}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontFamily="monospace" fontWeight="medium">
                        {formatBtcValue(tx.fee)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontFamily="monospace" color="text.secondary">
                        {formatFileSize(tx.size)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontFamily="monospace">
                        {tx.vin?.length || 0}/{tx.vout?.length || 0}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BlockTransactions;
