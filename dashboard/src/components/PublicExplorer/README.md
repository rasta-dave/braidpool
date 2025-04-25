# Public Explorer

The Public Explorer component provides a visualization of block data in the Braidpool dashboard. It displays block information in both chart and table formats.

## Features

- Line chart visualization of block data
- Detailed table view of block information
- Real-time data updates
- Responsive design

## Setup

1. Install dependencies:

```bash
cd mock-api
npm install
```

2. Start the mock API server:

```bash
npm run dev
```

3. The component will be available as a new tab in the dashboard.

## API Endpoints

- `GET /blocks`: Returns mock block data for visualization

## Development

The component uses:

- React
- Material-UI
- Recharts
- TypeScript

## Mock API

The mock API server provides sample data for development and testing. It runs on port 3001 by default.
