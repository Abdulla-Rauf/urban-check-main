import { Router } from 'express';
import { ShippingController } from '../../controllers/shipping.controller.js';

const router = Router();

// GET /api/admin/shipping/couriers - List supported couriers (DTDC, Delhivery, GenericCourier)
router.get('/couriers', ShippingController.getCouriers);

// GET /api/admin/shipping/pending-orders - List orders eligible for AWB generation
router.get('/pending-orders', ShippingController.getPendingOrders);

// GET /api/admin/shipping - Paginated shipments with search & filters
router.get('/', ShippingController.getShipments);

// POST /api/admin/shipping/create - Create shipment, select courier, generate AWB
router.post('/create', ShippingController.createShipment);

// POST /api/admin/shipping/update-tracking - Update tracking status, event location, and description
router.post('/update-tracking', ShippingController.updateTracking);

// POST /api/admin/shipping/cancel - Cancel courier shipment
router.post('/cancel', ShippingController.cancelShipment);

// GET /api/admin/shipping/:identifier/tracking - View tracking history
router.get('/:identifier/tracking', ShippingController.getTracking);

export default router;
