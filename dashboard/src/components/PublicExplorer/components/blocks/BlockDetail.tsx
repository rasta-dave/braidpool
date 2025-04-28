import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Paper,
  Typography,
  Chip,
  Tooltip,
  Link,
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
  previousBlockHash: string;
  nextBlockHash?: string;
}

export interface Transaction extends BraidTransaction {}

interface BlockDetailProps {
  block: Block | null;
  isLoading?: boolean;
  error?: string;
}

const BlockDetail: React.FC<BlockDetailProps> = ({
  block,
  isLoading = false,
  error,
}) => {
  if (isLoading) {
    return <Typography>Loading block information... 🔄</Typography>;
  }

  if (error) {
    return (
      <Typography color="error">Error loading block: {error} ❌</Typography>
    );
  }

  if (!block) {
    return (
      <Typography>
        No block information available. Select a block to view details. 🔍
      </Typography>
    );
  }

  // Data for display in the info grid
  const blockInfo = [
    { label: 'Block Height', value: block.height.toLocaleString() },
    {
      label: 'Timestamp',
      value: formatTimestamp(block.timestamp),
      tooltip: timeAgo(block.timestamp),
    },
    {
      label: 'Transactions',
      value: block.transactions.length.toLocaleString(),
    },
    { label: 'Size', value: formatFileSize(block.size) },
    { label: 'Weight', value: `${block.weight.toLocaleString()} WU` },
    { label: 'Confirmations', value: block.confirmations.toLocaleString() },
    { label: 'Difficulty', value: formatDifficulty(block.difficulty) },
    { label: 'Bits', value: block.bits },
    { label: 'Nonce', value: block.nonce.toLocaleString() },
    { label: 'Version', value: `0x${block.version.toString(16)}` },
    { label: 'Merkle Root', value: truncateString(block.merkleRoot, 12) },
    { label: 'Total Fees', value: formatBtcValue(block.fees) },
  ];

  return (
    <Box>
      <Card sx={{ mb: 3 }} className="block-detail">
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
            className="block-header"
          >
            <Typography variant="h5" component="h1" className="block-title">
              Block #{block.height.toLocaleString()}
              <Tooltip title={timeAgo(block.timestamp)}>
                <Chip
                  size="small"
                  label={formatTimestamp(block.timestamp)}
                  color="primary"
                  sx={{ ml: 2 }}
                />
              </Tooltip>
            </Typography>
          </Box>

          <Typography
            variant="subtitle1"
            gutterBottom
            mb={2}
            className="block-hash"
          >
            Block Hash:
            <Typography component="span" fontFamily="monospace">
              {block.hash}
            </Typography>
          </Typography>

          <Box
            display="flex"
            flexDirection="row"
            gap={2}
            mb={2}
            className="navigation-links"
          >
            {block.previousBlockHash && (
              <Link
                href={`#/explorer/block/${block.previousBlockHash}`}
                underline="hover"
                className="nav-link"
              >
                ← Previous Block
              </Link>
            )}
            {block.nextBlockHash && (
              <Link
                href={`#/explorer/block/${block.nextBlockHash}`}
                underline="hover"
                className="nav-link"
              >
                Next Block →
              </Link>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2} className="block-info">
            {blockInfo.map((info) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={info.label}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: 'background.default',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  className="info-item"
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    className="info-label"
                  >
                    {info.label}
                  </Typography>
                  {info.tooltip ? (
                    <Tooltip title={info.tooltip} placement="top" arrow>
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        sx={{
                          wordBreak: 'break-all',
                          fontFamily:
                            info.label === 'Merkle Root'
                              ? 'monospace'
                              : 'inherit',
                        }}
                        className="info-value"
                      >
                        {info.value}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      sx={{
                        wordBreak: 'break-all',
                        fontFamily:
                          info.label === 'Merkle Root'
                            ? 'monospace'
                            : 'inherit',
                      }}
                      className="info-value"
                    >
                      {info.value}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <div className="transactions-container">
        <BlockTransactions transactions={block.transactions} />
      </div>
    </Box>
  );
};

export default BlockDetail;
