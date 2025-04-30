import React, { useState } from 'react';
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
  Pagination,
} from '@mui/material';
import {
  formatTimestamp,
  formatBtcValue,
  truncateString,
  formatFileSize,
  formatDifficulty,
  timeAgo,
  copyToClipboard,
  calculateDollarAmount,
} from '../../utils';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';
import BlockTransactions from './BlockTransactions';
import { BraidTransaction } from '../transactions/BraidTransaction';
import { formatDistanceToNow } from 'date-fns';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import '../../PublicExplorer.css';

// Custom tooltip wrapper for copy functionality
interface CopyTooltipProps {
  copiedText: string | null;
  compareValue: string;
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const CopyTooltip: React.FC<CopyTooltipProps> = ({
  copiedText,
  compareValue,
  children,
  placement = 'top',
}) => {
  return (
    <Tooltip
      title={
        copiedText === compareValue ? 'Copied! 📋✅' : 'Copy to clipboard 📋'
      }
      placement={placement}
    >
      {children}
    </Tooltip>
  );
};

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
  miner?: string;
  health?: number;
  feeSpan?: string;
  medianFee?: string;
  subsidyAndFees?: string;
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
  const [page, setPage] = useState(1);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const itemsPerPage = 10;
  const navigate = useNavigate();

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

  const handleBlockClick = (hash: string) => {
    console.log('🔗 Navigating to block with hash:', hash);
    navigate(`/explorer/block/${hash}`);
  };

  const handleTxidClick = (txid: string) => {
    console.log('🔗 Navigating to transaction with ID:', txid);
    navigate(`/explorer/tx/${txid}`);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
    console.log(`📄 Changing to page ${value}`);
  };

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

  // Format size in MB
  const formatSize = (size: number): string => {
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  };

  // Format weight in MWU
  const formatWeight = (weight: number): string => {
    return `${(weight / 1000 / 1000).toFixed(2)} MWU`;
  };

  // Format health percentage
  const formatHealth = (health: number = 100): string => {
    return `${health}%`;
  };

  // Format satoshis to BTC
  const formatBTC = (satoshis: number): string => {
    return `${(satoshis / 100000000).toFixed(8)} BTC`;
  };

  // Calculate dollar amount
  const calculateDollarAmount = (btc: number): string => {
    // Using a fixed exchange rate for simplicity
    const rate = 95200; // 1 BTC = $95,200 USD
    const usdAmount = (btc / 100000000) * rate;
    return `$${usdAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Calculate total pages
  const totalPages = Math.ceil(block.transactions.length / itemsPerPage);

  // Get current page items
  const currentTransactions = block.transactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

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
                Hash
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  variant="body1"
                  className="clickable-hash"
                  sx={{ wordBreak: 'break-all' }}
                >
                  {block.hash}
                </Typography>
                <CopyTooltip copiedText={copiedText} compareValue={block.hash}>
                  <Box component="span" sx={{ ml: 1 }}>
                    <ContentCopyIcon
                      fontSize="small"
                      sx={{
                        fontSize: '1rem',
                        color:
                          copiedText === block.hash ? '#4caf50' : '#00acc1',
                        cursor: 'pointer',
                      }}
                      onClick={(e) => handleCopyToClipboard(block.hash, e)}
                    />
                  </Box>
                </CopyTooltip>
              </Box>
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
                {formatWeight(block.weight)}
              </Typography>
            </Box>

            <Box sx={{ width: { xs: '48%', md: '23%' } }}>
              <Typography variant="subtitle1" color="text.secondary">
                Health
              </Typography>
              <Typography variant="body1">
                {formatHealth(block.health)}
              </Typography>
            </Box>

            <Box sx={{ width: { xs: '48%', md: '23%' } }}>
              <Typography variant="subtitle1" color="text.secondary">
                Fee Span
              </Typography>
              <Typography variant="body1">
                {block.feeSpan || '1 - 300 sat/vB'}
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
              {block.previousBlockHash ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography
                    variant="body1"
                    className="clickable-hash"
                    sx={{
                      wordBreak: 'break-all',
                      cursor: 'pointer',
                    }}
                    onClick={() =>
                      handleBlockClick(block.previousBlockHash || '')
                    }
                  >
                    {block.previousBlockHash}
                    <LinkIcon
                      fontSize="small"
                      sx={{ ml: 0.5, fontSize: '0.9rem' }}
                    />
                  </Typography>
                  <CopyTooltip
                    copiedText={copiedText}
                    compareValue={block.previousBlockHash}
                  >
                    <Box component="span" sx={{ ml: 1 }}>
                      <ContentCopyIcon
                        fontSize="small"
                        sx={{
                          fontSize: '1rem',
                          color:
                            copiedText === block.previousBlockHash
                              ? '#4caf50'
                              : '#00acc1',
                          cursor: 'pointer',
                        }}
                        onClick={(e) =>
                          handleCopyToClipboard(
                            block.previousBlockHash || '',
                            e
                          )
                        }
                      />
                    </Box>
                  </CopyTooltip>
                </Box>
              ) : (
                <Typography variant="body1">Genesis Block</Typography>
              )}
            </Box>

            <Box sx={{ width: { xs: '48%', md: '23%' } }}>
              <Typography variant="subtitle1" color="text.secondary">
                Median Fee
              </Typography>
              <Typography variant="body1">
                {block.medianFee || '~1 sat/vB$0.13'}
              </Typography>
            </Box>

            <Box sx={{ width: { xs: '48%', md: '23%' } }}>
              <Typography variant="subtitle1" color="text.secondary">
                Total Fees
              </Typography>
              <Typography variant="body1">
                {formatBTC(block.fees)} {calculateDollarAmount(block.fees)}
              </Typography>
            </Box>

            <Box sx={{ width: { xs: '48%', md: '23%' } }}>
              <Typography variant="subtitle1" color="text.secondary">
                Subsidy + Fees
              </Typography>
              <Typography variant="body1">
                {block.subsidyAndFees || '3.153 BTC $300,347'}
              </Typography>
            </Box>

            <Box sx={{ width: { xs: '48%', md: '23%' } }}>
              <Typography variant="subtitle1" color="text.secondary">
                Miner
              </Typography>
              <Typography variant="body1">
                {block.miner || 'Unknown'}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h5">
          {block.transactions.length} transactions
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

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Transaction ID</TableCell>
              <TableCell>Timestamp</TableCell>
              <TableCell align="right">Size</TableCell>
              <TableCell align="right">Weight</TableCell>
              <TableCell align="right">Fee</TableCell>
              <TableCell align="right">Value</TableCell>
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
                        cursor: 'pointer',
                        color: '#00acc1',
                        '&:hover': {
                          color: '#007c91',
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {truncateString(tx.txid, 12)}
                      <LinkIcon
                        fontSize="small"
                        sx={{ ml: 0.5, fontSize: '0.9rem' }}
                      />
                    </Typography>
                    <CopyTooltip copiedText={copiedText} compareValue={tx.txid}>
                      <Box component="span" sx={{ ml: 1 }}>
                        <ContentCopyIcon
                          fontSize="small"
                          sx={{
                            fontSize: '0.9rem',
                            color:
                              copiedText === tx.txid ? '#4caf50' : '#00acc1',
                            cursor: 'pointer',
                            '&:hover': {
                              color: '#007c91',
                            },
                          }}
                          onClick={(e) => handleCopyToClipboard(tx.txid, e)}
                        />
                      </Box>
                    </CopyTooltip>
                  </Box>
                </TableCell>
                <TableCell>{formatTimestamp(tx.timestamp / 1000)}</TableCell>
                <TableCell align="right">{formatFileSize(tx.size)}</TableCell>
                <TableCell align="right">
                  {(tx.weight / 1000).toFixed(2)} kWU
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
                  <Typography fontFamily="monospace" fontWeight="medium">
                    {formatBtcValue(tx.value)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            siblingCount={2}
            boundaryCount={2}
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

export default BlockDetail;
