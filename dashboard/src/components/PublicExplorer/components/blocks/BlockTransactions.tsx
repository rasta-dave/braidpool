import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Pagination,
} from '@mui/material';
import { formatTimestamp, formatBtcValue, formatFileSize } from '../../utils';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import '../../PublicExplorer.css';

interface Transaction {
  txid: string;
  timestamp: number;
  size: number;
  fee: number;
  value?: number;
  vin?: any[];
  vout?: any[];
  feeRate?: number;
}

interface BlockTransactionsProps {
  transactions: Transaction[];
}

const BlockTransactions: React.FC<BlockTransactionsProps> = ({
  transactions,
}) => {
  const [page, setPage] = useState(1);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const navigate = useNavigate();

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
    console.log(`📄 Changing to page ${value}`);
  };

  const handleCopyToClipboard = (text: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the parent click handler
    console.log('📋 Copying to clipboard:', text);
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log('✅ Copied successfully!');
        setCopiedText(text);
        // Clear the copied text status after 2 seconds
        setTimeout(() => {
          setCopiedText(null);
        }, 2000);
      })
      .catch((err) => {
        console.error('❌ Failed to copy text:', err);
      });
  };

  const handleTxidClick = (txid: string) => {
    console.log('🔗 Navigating to transaction with ID:', txid);
    navigate(`/explorer/tx/${txid}`);
  };

  // Get current page items
  const currentTransactions = transactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Calculate dollar amount
  const calculateDollarAmount = (btc: number): string => {
    // Using a fixed exchange rate for simplicity
    const rate = 95200; // 1 BTC = $95,200 USD
    const usdAmount = btc * rate;
    return `$${usdAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h5" component="h2">
              {transactions.length} transactions
            </Typography>
            {totalPages > 1 && (
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                siblingCount={1}
                boundaryCount={1}
                showFirstButton
                showLastButton
              />
            )}
          </Box>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ bgcolor: 'background.default' }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell align="right">Fee</TableCell>
                  <TableCell align="right">Size</TableCell>
                  <TableCell align="right">Fee Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentTransactions.map((tx) => (
                  <TableRow key={tx.txid} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                          className="clickable-txid"
                          onClick={() => handleTxidClick(tx.txid)}
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontFamily: 'monospace',
                          }}
                        >
                          {tx.txid.slice(0, 16)}...
                          <LinkIcon
                            fontSize="small"
                            sx={{ ml: 0.5, fontSize: '0.9rem' }}
                          />
                        </Typography>
                        <Tooltip
                          title={
                            copiedText === tx.txid
                              ? 'Copied!'
                              : 'Copy to clipboard'
                          }
                          placement="top"
                        >
                          <Box component="span" sx={{ ml: 1 }}>
                            <ContentCopyIcon
                              fontSize="small"
                              sx={{
                                fontSize: '0.9rem',
                                color:
                                  copiedText === tx.txid
                                    ? '#4caf50'
                                    : '#00acc1',
                                cursor: 'pointer',
                              }}
                              onClick={(e) => handleCopyToClipboard(tx.txid, e)}
                            />
                          </Box>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={formatTimestamp(tx.timestamp)}>
                        <Typography variant="body2">
                          {formatTimestamp(tx.timestamp)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontFamily="monospace" fontWeight="medium">
                        {formatBtcValue(tx.value || tx.fee * 100)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontFamily="monospace" fontWeight="medium">
                        {formatBtcValue(tx.fee)}{' '}
                        <Typography
                          component="span"
                          sx={{ color: 'text.secondary', fontSize: '0.85em' }}
                        >
                          {calculateDollarAmount(tx.fee / 100000000)}
                        </Typography>
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontFamily="monospace" color="text.secondary">
                        {formatFileSize(tx.size)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontFamily="monospace">
                        {tx.feeRate
                          ? `${tx.feeRate} sat/vB`
                          : tx.size
                          ? `${Math.round((tx.fee / tx.size) * 100)} sat/vB`
                          : 'Unknown'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                siblingCount={1}
                boundaryCount={1}
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default BlockTransactions;
