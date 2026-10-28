import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database.js';
import { shippingService } from '../src/services/shipping/shipping.service.js';
import { Order } from '../src/models/Order.js';
import { Shipment } from '../src/models/Shipment.js';

async function runShippingTests() {
  console.log('🚀 --- STARTING SHIPPING ABSTRACTION LAYER AUTOMATED TESTS --- \n');

  try {
    await connectDatabase();
    console.log('✅ Connected to MongoDB Atlas\n');

    // 1. Test Available Couriers
    console.log('--- 1. Testing Courier Providers Discovery ---');
    const couriers = shippingService.getAvailableCouriers();
    console.log(`Found ${couriers.length} courier providers:`, couriers.map((c) => `${c.id} (${c.name})`).join(', '));
    if (couriers.length < 3) {
      throw new Error('Expected at least 3 couriers (DTDC, Delhivery, GenericCourier).');
    }
    const hasDtdc = couriers.some((c) => c.id === 'DTDC');
    const hasDelhivery = couriers.some((c) => c.id === 'Delhivery');
    const hasGeneric = couriers.some((c) => c.id === 'GenericCourier');
    if (!hasDtdc || !hasDelhivery || !hasGeneric) {
      throw new Error('Missing one or more required couriers: DTDC, Delhivery, GenericCourier');
    }
    console.log('✅ All 3 providers (DTDC, Delhivery, GenericCourier) registered and active.\n');

    const dummyUserId = new mongoose.Types.ObjectId();

    // 2. Setup Test Order
    console.log('--- 2. Creating Test Order for DTDC Dispatch ---');
    const testOrderNum = `ORD-SHIP-${Date.now().toString().slice(-6)}`;
    const testOrder = await Order.create({
      orderNumber: testOrderNum,
      user: dummyUserId,
      customer: {
        id: dummyUserId,
        name: 'Siddharth Varma',
        email: 'siddharth@example.com',
        phone: '+91 98765 43210',
      },
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          name: 'Double-Breasted Cashmere Coat',
          brand: 'Urban Check Atelier',
          quantity: 1,
          price: 42000,
          subtotal: 42000,
          variant: {
            sku: 'SKU-COAT-M',
            size: 'M',
            color: 'Camel',
          },
        },
      ],
      pricing: {
        subtotal: 42000,
        discount: 0,
        shipping: 0,
        tax: 2100,
        grandTotal: 44100,
      },
      payment: {
        method: 'COD',
        status: 'Pending',
        amount: 44100,
      },
      shippingAddress: {
        name: 'Siddharth Varma',
        phone: '+91 98765 43210',
        address: '74 Altamount Road, Cumballa Hill',
        apartment: 'Penthouse B',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '400026',
      },
      shipment: {
        courier: 'DTDC',
        carrier: 'DTDC Express Air',
        status: 'Confirmed',
      },
      orderStatus: 'Confirmed',
    });
    console.log(`✅ Test order created: #${testOrder.orderNumber}`);

    // 3. Create Shipment via DTDC
    console.log('\n--- 3. Testing DTDC Shipment Creation & AWB Generation ---');
    const dtdcShipment = await shippingService.createShipment({
      orderNumber: testOrder.orderNumber,
      courier: 'DTDC',
      weightKg: 1.2,
      originHub: 'Urban Check Atelier Mumbai Dispatch',
    });

    console.log(`✅ DTDC Shipment Created:`);
    console.log(` - Shipment ID: ${dtdcShipment.shipmentId}`);
    console.log(` - Courier: ${dtdcShipment.courier} (${dtdcShipment.carrierName})`);
    console.log(` - AWB: ${dtdcShipment.awb}`);
    console.log(` - Tracking URL: ${dtdcShipment.trackingUrl}`);
    console.log(` - Initial Events: ${dtdcShipment.trackingEvents?.length}`);

    if (!dtdcShipment.awb.startsWith('D')) {
      throw new Error(`Expected DTDC AWB to start with 'D', got: ${dtdcShipment.awb}`);
    }

    // Verify Order snapshot synchronized
    const syncedOrder = await Order.findById(testOrder._id);
    if (syncedOrder.shipment?.awb !== dtdcShipment.awb) {
      throw new Error('Order shipment snapshot was not synchronized with generated AWB.');
    }
    console.log(`✅ Order document embedded shipment snapshot verified: ${syncedOrder.shipment.awb}`);

    // 4. Test Delhivery Provider with second order
    console.log('\n--- 4. Testing Delhivery Shipment Creation & AWB Generation ---');
    const testOrderNum2 = `ORD-SHIP-${(Date.now() + 1).toString().slice(-6)}`;
    const testOrder2 = await Order.create({
      orderNumber: testOrderNum2,
      user: dummyUserId,
      customer: {
        id: dummyUserId,
        name: 'Ananya Roy',
        email: 'ananya@example.com',
        phone: '+91 91234 56789',
      },
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          name: 'Silk Organza Evening Blouse',
          brand: 'Urban Check',
          quantity: 1,
          price: 18500,
          subtotal: 18500,
          variant: {
            sku: 'SKU-SILK-S',
            size: 'S',
            color: 'Ivory',
          },
        },
      ],
      pricing: { subtotal: 18500, discount: 0, shipping: 0, tax: 925, grandTotal: 19425 },
      payment: { method: 'Razorpay', status: 'Paid', amount: 19425 },
      shippingAddress: {
        name: 'Ananya Roy',
        phone: '+91 91234 56789',
        address: 'Ballygunge Circular Road',
        city: 'Kolkata',
        state: 'West Bengal',
        country: 'India',
        postalCode: '700019',
      },
      shipment: {
        courier: 'Delhivery',
        carrier: 'Delhivery Surface & Express',
        status: 'Confirmed',
      },
      orderStatus: 'Confirmed',
    });

    const delhiveryShipment = await shippingService.createShipment({
      orderNumber: testOrder2.orderNumber,
      courier: 'Delhivery',
      weightKg: 0.6,
    });
    console.log(`✅ Delhivery Shipment Created:`);
    console.log(` - AWB: ${delhiveryShipment.awb}`);
    console.log(` - Carrier: ${delhiveryShipment.carrierName}`);
    console.log(` - Tracking URL: ${delhiveryShipment.trackingUrl}`);
    if (!delhiveryShipment.awb.startsWith('DLV')) {
      throw new Error(`Expected Delhivery AWB to start with 'DLV', got: ${delhiveryShipment.awb}`);
    }

    // 5. Test Generic Courier
    console.log('\n--- 5. Testing Generic Courier Provider ---');
    const testOrderNum3 = `ORD-SHIP-${(Date.now() + 2).toString().slice(-6)}`;
    const testOrder3 = await Order.create({
      orderNumber: testOrderNum3,
      user: dummyUserId,
      customer: {
        id: dummyUserId,
        name: 'Rajesh Mehra',
        email: 'rajesh@example.com',
        phone: '+91 99887 76655',
      },
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          name: 'Tailored Wool Trousers',
          brand: 'Urban Check',
          quantity: 1,
          price: 14000,
          subtotal: 14000,
          variant: {
            sku: 'SKU-TR-32',
            size: '32',
            color: 'Charcoal',
          },
        },
      ],
      pricing: { subtotal: 14000, discount: 0, shipping: 0, tax: 700, grandTotal: 14700 },
      payment: { method: 'COD', status: 'Pending', amount: 14700 },
      shippingAddress: {
        name: 'Rajesh Mehra',
        phone: '+91 99887 76655',
        address: 'Jubilee Hills, Road No. 36',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        postalCode: '500033',
      },
      shipment: {
        courier: 'GenericCourier',
        carrier: 'Generic Courier (Boutique Delivery)',
        status: 'Confirmed',
      },
      orderStatus: 'Confirmed',
    });

    const genericShipment = await shippingService.createShipment({
      orderNumber: testOrder3.orderNumber,
      courier: 'GenericCourier',
      weightKg: 0.5,
    });
    console.log(`✅ Generic Courier Shipment Created:`);
    console.log(` - AWB: ${genericShipment.awb}`);
    console.log(` - Courier: ${genericShipment.courier}`);
    if (!genericShipment.awb.startsWith('UC')) {
      throw new Error(`Expected GenericCourier AWB to start with 'UC', got: ${genericShipment.awb}`);
    }

    // 6. Test Tracking Milestone Events Sequence:
    // Order Placed -> Confirmed -> Packed -> Shipped -> Out for Delivery -> Delivered
    console.log('\n--- 6. Testing Full Milestone Telemetry Progression ---');
    console.log('Advancing consignment #1 through full delivery lifecycle:');

    // Milestone 1: Packed
    console.log(' - Milestone: Packed');
    await shippingService.updateTracking(dtdcShipment.awb, {
      status: 'Packed',
      location: 'Urban Check Fulfillment Hub, Mumbai',
      description: 'Garment examined, folded with archival tissue paper, and packaged in signature magnetic box.',
    });

    // Milestone 2: Shipped
    console.log(' - Milestone: Shipped');
    await shippingService.updateTracking(dtdcShipment.awb, {
      status: 'Shipped',
      location: 'DTDC Bhiwandi Air Gateway, Maharashtra',
      description: 'Handed over to DTDC Priority Air fleet. In rapid flight transit to destination.',
    });

    // Milestone 3: Out for Delivery
    console.log(' - Milestone: Out for Delivery');
    await shippingService.updateTracking(dtdcShipment.awb, {
      status: 'Out for Delivery',
      location: 'DTDC South Mumbai Delivery Center',
      description: 'Assigned to courier specialist for direct door handover.',
    });

    // Milestone 4: Delivered
    console.log(' - Milestone: Delivered');
    await shippingService.updateTracking(dtdcShipment.awb, {
      status: 'Delivered',
      location: 'Patron Residence, Altamount Road',
      description: 'Delivered and signed by Siddharth Varma. Proof of delivery registered.',
    });

    // 7. Verify Tracking History
    console.log('\n--- 7. Verifying Complete Customer Tracking Dossier ---');
    const trackingHistory = await shippingService.getTrackingHistory(dtdcShipment.awb);
    console.log(`Consignment #${trackingHistory.awb} Status: ${trackingHistory.status}`);
    console.log(`Recorded Events: ${trackingHistory.trackingEvents.length}`);

    trackingHistory.trackingEvents.forEach((evt, idx) => {
      console.log(`  [${idx + 1}] ${evt.status.padEnd(18)} | ${evt.date} ${evt.time} | ${evt.location} -> "${evt.description.slice(0, 45)}..."`);
      if (!evt.status || !evt.date || !evt.time || !evt.description) {
        throw new Error(`Event at index ${idx} is missing required milestone fields.`);
      }
    });

    // Also check tracking by Order Number
    const trackByOrder = await shippingService.getTrackingHistory(testOrder.orderNumber);
    if (trackByOrder.awb !== dtdcShipment.awb) {
      throw new Error('Lookup by orderNumber failed to retrieve matching consignment.');
    }
    console.log('✅ Tracking query by Order Number succeeded and matches AWB.');

    // Verify order payment was updated upon delivery for COD
    const deliveredOrder = await Order.findById(testOrder._id);
    console.log(`Delivered order payment status: ${deliveredOrder.payment.status} (Expected: Paid)`);
    if (deliveredOrder.payment.status !== 'Paid') {
      throw new Error('Expected COD order payment status to be updated to Paid upon delivery.');
    }

    // 8. Test Cancellation
    console.log('\n--- 8. Testing Shipment Cancellation ---');
    const cancelRes = await shippingService.cancelShipment(
      delhiveryShipment.awb,
      'Patron modified delivery address before courier pickup.'
    );
    console.log(`✅ Cancelled shipment #${delhiveryShipment.awb}: Status = ${cancelRes.status}`);
    const cancelledDoc = await Shipment.findOne({ awb: delhiveryShipment.awb });
    if (cancelledDoc.status !== 'Cancelled') {
      throw new Error('Shipment status was not updated to Cancelled in database.');
    }

    // 9. Clean up
    console.log('\n--- 9. Cleaning Up Test Documents ---');
    await Order.deleteMany({ _id: { $in: [testOrder._id, testOrder2._id, testOrder3._id] } });
    await Shipment.deleteMany({
      awb: { $in: [dtdcShipment.awb, delhiveryShipment.awb, genericShipment.awb] },
    });
    console.log('✅ Temporary test orders and shipments purged.');

    console.log('\n🎉 ALL SHIPPING LAYER AUTOMATED TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ Shipping test failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runShippingTests();
