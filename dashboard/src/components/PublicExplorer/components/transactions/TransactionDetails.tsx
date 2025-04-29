import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { TransactionService } from './transactionService';
import { BraidTransaction, BraidVin, BraidVout } from './BraidTransaction';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid as MuiGrid,
  Paper,
  Divider,
  Chip,
  CircularProgress,
  Tooltip,
  Link,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  formatTimestamp,
  formatBtcValue,
  formatFileSize,
  timeAgo,
} from '../../utils';

const TransactionDetails: React.FC = () => {
  const { txid } = useParams<{ txid: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<BraidTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('⚡ TransactionDetails component rendering');
  console.log('⚡ txid from params:', txid);
  console.log('⚡ current location:', location.pathname);

  const handleBackToExplorer = () => {
    console.log('🔙 Navigating back to explorer from tx details');
    navigate('/explorer');
  };

  useEffect(() => {
    const fetchTransaction = async () => {
      let transactionId = txid;
      console.log('🔍 Transaction ID from params:', transactionId);

      if (!transactionId) {
        // If we don't have the ID from params, try to extract from pathname
        const pathParts = location.pathname.split('/');
        transactionId = pathParts[pathParts.length - 1];
        console.log('📋 Extracted from pathname:', transactionId);
      }

      if (!transactionId) {
        console.error('❌ Transaction ID not found in URL');
        setError('Transaction ID not found in URL');
        setLoading(false);
        return;
      }

      try {
        console.log('🔄 Fetching transaction details for:', transactionId);
        const txService = new TransactionService();
        const tx = await txService.getTransaction(transactionId);
        console.log('✅ Transaction data received:', tx);
        setTransaction(tx);
      } catch (err) {
        console.error('❌ Error fetching transaction:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load transaction details'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [txid, location]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" m={3}>
        <CircularProgress />
        <Typography ml={2}>Loading transaction details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToExplorer}
          variant="outlined"
          sx={{ mb: 2 }}
        >
          Back to Explorer
        </Button>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!transaction) {
    return (
      <Box m={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToExplorer}
          variant="outlined"
          sx={{ mb: 2 }}
        >
          Back to Explorer
        </Button>
        <Typography color="error" variant="h6">
          Transaction not found
        </Typography>
      </Box>
    );
  }

  // Prepare transaction info for display
  const txInfo = [
    {
      label: 'Status',
      value: transaction.status.confirmed ? 'Confirmed' : 'Pending',
      chip: transaction.status.confirmed ? (
        <Chip size="small" label="Confirmed" color="success" />
      ) : (
        <Chip size="small" label="Pending" color="warning" />
      ),
    },
    {
      label: 'Block Height',
      value: transaction.status.block_height
        ? transaction.status.block_height.toLocaleString()
        : 'Unconfirmed',
    },
    {
      label: 'Timestamp',
      value: formatTimestamp(transaction.timestamp),
      tooltip: timeAgo(transaction.timestamp),
    },
    {
      label: 'Fee',
      value: formatBtcValue(transaction.fee),
    },
    {
      label: 'Fee Rate',
      value: `${transaction.feePerVsize.toFixed(2)} sat/vB`,
    },
    {
      label: 'Size',
      value: formatFileSize(transaction.size),
    },
    {
      label: 'Weight',
      value: `${transaction.weight.toLocaleString()} WU`,
    },
    {
      label: 'Version',
      value: transaction.version.toString(),
    },
  ];

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBackToExplorer}
        variant="outlined"
        sx={{ mb: 2 }}
      >
        Back to Explorer
      </Button>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h5" component="h1">
              Transaction Details
              {transaction.status.confirmed && (
                <Tooltip title={timeAgo(transaction.timestamp)}>
                  <Chip
                    size="small"
                    label={formatTimestamp(transaction.timestamp)}
                    color="primary"
                    sx={{ ml: 2 }}
                  />
                </Tooltip>
              )}
            </Typography>
          </Box>

          <Typography variant="subtitle1" gutterBottom mb={2}>
            Transaction ID:
            <Typography component="span" fontFamily="monospace" sx={{ ml: 1 }}>
              {transaction.txid}
            </Typography>
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {txInfo.map((info) => (
              <Box
                key={info.label}
                sx={{
                  flex: '1 1 250px',
                  minWidth: {
                    xs: '100%',
                    sm: 'calc(50% - 16px)',
                    md: 'calc(33.333% - 16px)',
                  },
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: 'background.default',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {info.label}
                  </Typography>
                  {info.tooltip ? (
                    <Tooltip title={info.tooltip} placement="top" arrow>
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        sx={{
                          wordBreak: 'break-all',
                        }}
                      >
                        {info.chip || info.value}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      sx={{
                        wordBreak: 'break-all',
                      }}
                    >
                      {info.chip || info.value}
                    </Typography>
                  )}
                </Paper>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Inputs Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Inputs ({transaction.vin.length})
          </Typography>

          <Box mt={2}>
            {transaction.vin.map((input: BraidVin, index: number) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: 'background.default',
                }}
              >
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle2">
                    Input #{index + 1}
                  </Typography>
                  {input.is_coinbase ? (
                    <Chip size="small" label="Coinbase" color="success" />
                  ) : (
                    <Typography variant="subtitle2" fontFamily="monospace">
                      {formatBtcValue(input.prevout?.value || 0)}
                    </Typography>
                  )}
                </Box>

                {!input.is_coinbase && (
                  <>
                    <Typography variant="caption" color="text.secondary">
                      From Transaction:
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="monospace"
                      sx={{ mb: 1, wordBreak: 'break-all' }}
                    >
                      {input.txid}
                    </Typography>

                    {input.prevout && (
                      <>
                        <Typography variant="caption" color="text.secondary">
                          Address:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontFamily="monospace"
                          sx={{ wordBreak: 'break-all' }}
                        >
                          {input.prevout.scriptpubkey_address || 'Unknown'}
                        </Typography>
                      </>
                    )}
                  </>
                )}
              </Paper>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Outputs Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Outputs ({transaction.vout.length})
          </Typography>

          <Box mt={2}>
            {transaction.vout.map((output: BraidVout, index: number) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: 'background.default',
                }}
              >
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle2">
                    Output #{index + 1}
                  </Typography>
                  <Typography variant="subtitle2" fontFamily="monospace">
                    {formatBtcValue(output.value)}
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Address:
                </Typography>
                <Typography
                  variant="body2"
                  fontFamily="monospace"
                  sx={{ mb: 1, wordBreak: 'break-all' }}
                >
                  {output.scriptpubkey_address || 'Unknown'}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Type:
                </Typography>
                <Typography variant="body2">
                  {output.scriptpubkey_type}
                </Typography>
              </Paper>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TransactionDetails;
