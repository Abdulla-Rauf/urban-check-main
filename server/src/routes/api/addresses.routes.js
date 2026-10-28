import { Router } from 'express';
import { AddressController } from '../../controllers/address.controller.js';
import { requireCustomerAuth } from '../../middleware/auth.js';

const router = Router();

router.use(requireCustomerAuth);

router.get('/', AddressController.getAddresses);
router.post('/', AddressController.createAddress);
router.put('/:id', AddressController.updateAddress);
router.delete('/:id', AddressController.deleteAddress);
router.patch('/:id/default', AddressController.setDefault);

export default router;
