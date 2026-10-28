import { Router } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';

const router = Router();

const mockTransactions = [
  { id: 'TXN-9021', orderId: 'ORD-9821', gateway: 'Razorpay', type: 'Credit', amount: 14480, status: 'Success', date: '2026-09-23 10:15:00' },
  { id: 'TXN-9020', orderId: 'ORD-9820', gateway: 'Razorpay', type: 'Credit', amount: 8990, status: 'Success', date: '2026-09-23 09:30:00' },
  { id: 'TXN-9019', orderId: 'ORD-9812', gateway: 'Razorpay', type: 'Refund', amount: 5490, status: 'Success', date: '2026-09-22 17:00:00' },
];

const mockFinancialLedger = [
  { entryId: 'FIN-001', account: 'Accounts Receivable', debit: 14480, credit: 0, balance: 1482500, ref: 'TXN-9021', date: '2026-09-23' },
  { entryId: 'FIN-002', account: 'Courier Clearing', debit: 0, credit: 220, balance: 1482280, ref: 'SHP-901', date: '2026-09-23' },
];

router.get('/transactions', (req, res) => {
  return ApiResponse.success(res, 'Finance transactions retrieved', mockTransactions);
});

router.get('/revenue', (req, res) => {
  return ApiResponse.success(res, 'Revenue summary retrieved', {
    netRevenue: 1482500,
    grossSales: 1530000,
    discounts: 32000,
    refunds: 15500,
    taxesCollected: 198000,
  });
});

router.get('/ledger', (req, res) => {
  return ApiResponse.success(res, 'Financial ledger retrieved', mockFinancialLedger);
});

export default router;
