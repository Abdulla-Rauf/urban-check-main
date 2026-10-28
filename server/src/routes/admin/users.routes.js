import { Router } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';

const router = Router();

const mockStaff = [
  { id: 'ADM-1', name: 'Elena Rostova', email: 'elena@urbancheck.com', role: 'Super Admin', status: 'Active', lastLogin: 'Today, 08:30 AM' },
  { id: 'ADM-2', name: 'Kabir Singhania', email: 'kabir@urbancheck.com', role: 'Product Manager', status: 'Active', lastLogin: 'Yesterday, 03:15 PM' },
  { id: 'ADM-3', name: 'Aarav Desai', email: 'aarav@urbancheck.com', role: 'Order Manager', status: 'Active', lastLogin: 'Today, 09:00 AM' },
  { id: 'ADM-4', name: 'Simran Walia', email: 'simran@urbancheck.com', role: 'Finance Manager', status: 'Active', lastLogin: '2026-09-21' },
];

router.get('/', (req, res) => {
  return ApiResponse.success(res, 'Admin staff users retrieved', mockStaff);
});

router.post('/', (req, res) => {
  return ApiResponse.success(res, 'Admin user invited', { id: `ADM-${mockStaff.length + 1}`, ...req.body }, 201);
});

export default router;
