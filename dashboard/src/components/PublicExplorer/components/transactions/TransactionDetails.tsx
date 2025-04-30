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
  ButtonGroup,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import LinkIcon from '@mui/icons-material/Link';
import LaunchIcon from '@mui/icons-material/Launch';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  formatTimestamp,
  formatBtcValue,
  formatFileSize,
  timeAgo,
} from '../../utils';
import './TransactionDetails.css';

interface DebugInfoProps {
  transaction: BraidTransaction;
  showDebug: boolean;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ transaction, showDebug }) => {
  if (!showDebug) return null;

  return (
    <Box className="debug-info">
      <Typography className="debug-info-title">🐞 Debug Information</Typography>
      <pre className="debug-info-content">
        {JSON.stringify(
          {
            txid: transaction.txid,
            hash: transaction.hash,
            size: transaction.size,
            weight: transaction.weight,
            fee: transaction.fee,
            feePerVsize: transaction.feePerVsize,
            timestamp: transaction.timestamp,
            status: transaction.status,
            vinCount: transaction.vin.length,
            voutCount: transaction.vout.length,
          },
          null,
          2
        )}
      </pre>
    </Box>
  );
};

const TransactionDetails: React.FC = () => {
  const { txid } = useParams<{ txid: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<BraidTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  console.log('⚡ TransactionDetails component rendering');
  console.log('⚡ txid from params:', txid);
  console.log('⚡ current location:', location.pathname);

  const handleBackToExplorer = () => {
    console.log('🔙 Navigating back to explorer from tx details');
    navigate('/explorer');
  };

  const handleBackToDashboard = () => {
    console.log('🏠 Navigating back to dashboard from tx details');
    navigate('/', { replace: true });
  };

  const handleTxidClick = (id: string) => {
    console.log('🔗 Clicking transaction link:', id);
    console.log('🚀 Navigating to transaction details page');
    navigate(`/explorer/tx/${id}`);
  };

  const handleAddressClick = (address: string) => {
    console.log('🔗 Clicking address link:', address);
    // In a real app, you would navigate to an address page
    console.log(`🏠 Would navigate to address details: ${address}`);
    // For demo purposes, we'll show an alert
    alert(`Feature coming soon: View details for address ${address}`);
  };

  const handleBlockClick = (height: number) => {
    console.log('🔗 Clicking block height:', height);
    console.log(`🧱 Navigating to block details page for height: ${height}`);
    navigate(`/explorer/block/${height}`);
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
        console.log('💲 Transaction fee:', tx.fee);
        console.log('📏 Transaction size:', tx.size);
        console.log('⚖️ Transaction weight:', tx.weight);
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

  // Add keyboard shortcut for toggling debug mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+D to toggle debug mode
      if (e.altKey && e.key === 'd') {
        console.log('🐞 Toggling debug mode');
        setShowDebug((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
      clickable: transaction.status.block_height ? true : false,
      onClick: () => handleBlockClick(transaction.status.block_height!),
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
      {transaction && (
        <DebugInfo transaction={transaction} showDebug={showDebug} />
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <ButtonGroup variant="outlined">
          <Button startIcon={<ArrowBackIcon />} onClick={handleBackToExplorer}>
            Back to Explorer
          </Button>
          <Button startIcon={<HomeIcon />} onClick={handleBackToDashboard}>
            Back to Dashboard
          </Button>
        </ButtonGroup>
      </Box>

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
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                ml: 1,
              }}
            >
              <Typography
                component="span"
                fontFamily="monospace"
                className="clickable-txid"
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    color: '#007c91',
                  },
                }}
                onClick={() => handleTxidClick(transaction.txid)}
              >
                {transaction.txid}
                <Box component="span">
                  <LinkIcon
                    fontSize="small"
                    sx={{ ml: 0.5, fontSize: '0.9rem' }}
                  />
                </Box>
              </Typography>
              <Tooltip
                title={
                  copiedText === transaction.txid
                    ? 'Copied!'
                    : 'Copy to clipboard'
                }
                placement="top"
              >
                <Box component="span">
                  <ContentCopyIcon
                    fontSize="small"
                    sx={{
                      ml: 1,
                      fontSize: '1rem',
                      color:
                        copiedText === transaction.txid ? '#4caf50' : '#00acc1',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => handleCopyToClipboard(transaction.txid, e)}
                  />
                </Box>
              </Tooltip>
            </Box>
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
                        className={info.clickable ? 'clickable-block' : ''}
                        sx={{
                          wordBreak: 'break-all',
                          cursor: info.clickable ? 'pointer' : 'default',
                          display: info.clickable ? 'inline-flex' : 'block',
                          alignItems: 'center',
                          '&:hover': info.clickable
                            ? {
                                color: '#007c91',
                              }
                            : {},
                        }}
                        onClick={info.onClick}
                      >
                        {info.chip || info.value}
                        {info.clickable && (
                          <LaunchIcon
                            fontSize="small"
                            sx={{ ml: 0.5, fontSize: '0.9rem' }}
                          />
                        )}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      className={info.clickable ? 'clickable-block' : ''}
                      sx={{
                        wordBreak: 'break-all',
                        cursor: info.clickable ? 'pointer' : 'default',
                        display: info.clickable ? 'inline-flex' : 'block',
                        alignItems: 'center',
                        '&:hover': info.clickable
                          ? {
                              color: '#007c91',
                            }
                          : {},
                      }}
                      onClick={info.onClick}
                    >
                      {info.chip || info.value}
                      {info.clickable && (
                        <LaunchIcon
                          fontSize="small"
                          sx={{ ml: 0.5, fontSize: '0.9rem' }}
                        />
                      )}
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
                      className="clickable-txid"
                      sx={{
                        mb: 1,
                        wordBreak: 'break-all',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        '&:hover': {
                          color: '#007c91',
                        },
                      }}
                      onClick={() => handleTxidClick(input.txid)}
                    >
                      {input.txid}
                      <Box
                        component="span"
                        sx={{ display: 'inline-flex', alignItems: 'center' }}
                      >
                        <Tooltip title="View transaction" placement="top">
                          <Box component="span">
                            <LinkIcon
                              fontSize="small"
                              sx={{ ml: 0.5, fontSize: '0.9rem' }}
                            />
                          </Box>
                        </Tooltip>
                        <Tooltip
                          title={
                            copiedText === input.txid
                              ? 'Copied!'
                              : 'Copy to clipboard'
                          }
                          placement="top"
                        >
                          <Box component="span">
                            <ContentCopyIcon
                              fontSize="small"
                              sx={{
                                ml: 0.5,
                                fontSize: '0.9rem',
                                color:
                                  copiedText === input.txid
                                    ? '#4caf50'
                                    : 'inherit',
                                cursor: 'pointer',
                              }}
                              onClick={(e) =>
                                handleCopyToClipboard(input.txid, e)
                              }
                            />
                          </Box>
                        </Tooltip>
                      </Box>
                    </Typography>

                    {input.prevout && (
                      <>
                        <Typography variant="caption" color="text.secondary">
                          Address:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontFamily="monospace"
                          className="clickable-address"
                          sx={{
                            wordBreak: 'break-all',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover': {
                              color: '#007c91',
                            },
                          }}
                          onClick={() =>
                            handleAddressClick(
                              input.prevout?.scriptpubkey_address || ''
                            )
                          }
                        >
                          {input.prevout.scriptpubkey_address || 'Unknown'}
                          <Tooltip
                            title={
                              copiedText === input.prevout?.scriptpubkey_address
                                ? 'Copied!'
                                : 'Copy to clipboard'
                            }
                            placement="top"
                          >
                            <Box component="span">
                              <ContentCopyIcon
                                fontSize="small"
                                sx={{
                                  ml: 0.5,
                                  fontSize: '0.9rem',
                                  color:
                                    copiedText ===
                                    input.prevout?.scriptpubkey_address
                                      ? '#4caf50'
                                      : 'inherit',
                                  cursor: 'pointer',
                                }}
                                onClick={(e) =>
                                  handleCopyToClipboard(
                                    input.prevout?.scriptpubkey_address || '',
                                    e
                                  )
                                }
                              />
                            </Box>
                          </Tooltip>
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
                  className="clickable-address"
                  sx={{
                    mb: 1,
                    wordBreak: 'break-all',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': {
                      color: '#007c91',
                    },
                  }}
                  onClick={() =>
                    handleAddressClick(output.scriptpubkey_address || '')
                  }
                >
                  {output.scriptpubkey_address || 'Unknown'}
                  <Tooltip
                    title={
                      copiedText === output.scriptpubkey_address
                        ? 'Copied!'
                        : 'Copy to clipboard'
                    }
                    placement="top"
                  >
                    <Box component="span">
                      <ContentCopyIcon
                        fontSize="small"
                        sx={{
                          ml: 0.5,
                          fontSize: '0.9rem',
                          color:
                            copiedText === output.scriptpubkey_address
                              ? '#4caf50'
                              : 'inherit',
                          cursor: 'pointer',
                        }}
                        onClick={(e) =>
                          handleCopyToClipboard(
                            output.scriptpubkey_address || '',
                            e
                          )
                        }
                      />
                    </Box>
                  </Tooltip>
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
