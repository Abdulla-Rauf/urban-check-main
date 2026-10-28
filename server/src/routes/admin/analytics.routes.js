import { Router } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';

const router = Router();

router.get('/overview', (req, res) => {
  return ApiResponse.success(res, 'Analytics overview metrics', {
    conversionRate: '3.42%',
    averageSessionDuration: '4m 18s',
    trafficSources: [
      { source: 'Direct / Editorial', percentage: 42 },
      { source: 'Organic Search', percentage: 28 },
      { source: 'Instagram / Lookbook', percentage: 20 },
      { source: 'Referral', percentage: 10 },
    ],
    salesByDevice: { mobile: 74, desktop: 26 },
  });
});

export default router;
