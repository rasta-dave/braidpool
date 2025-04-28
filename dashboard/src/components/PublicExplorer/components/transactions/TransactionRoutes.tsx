import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TransactionDetails from './TransactionDetails';

const TransactionRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/tx/:txid" element={<TransactionDetails />} />
    </Routes>
  );
};

export default TransactionRoutes;
