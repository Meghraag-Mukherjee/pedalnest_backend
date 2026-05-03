import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { Booking } from "../models/bookingmodel.js";
import { Cycle } from "../models/cyclemodel.js";
import paypal from "@paypal/checkout-server-sdk";
import { env } from "../config/env.js";
import { sequelize } from "../config/db.js";

const router = Router();

// --- PAYPAL CONFIGURATION ---
// Initialize the environment and client globally for this file
const environment = new paypal.core.SandboxEnvironment(
  env.PAYPAL_CLIENT_ID,
  env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

/**
 * 1. Create PayPal Order
 * Initiates the payment on PayPal's side
 */
router.post("/create-paypal-order", authRequired, async (req, res) => {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [{
      amount: {
        currency_code: "USD",
        value: req.body.amount, 
      },
    }],
  });

  try {
    const order = await client.execute(request);
    res.json({ id: order.result.id });
  } catch (err) {
    console.error("PayPal Order Error:", err);
    res.status(500).json({ message: "PayPal Order failed" });
  }
});

/**
 * 2. Capture PayPal Order (Finalize Booking)
 */
router.post("/capture-paypal-order", authRequired, async (req, res) => {
  const { orderID, cycleId, hours, amount } = req.body;
  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  
  const t = await sequelize.transaction();

  try {
    const capture = await client.execute(request);
    
    if (capture.result.status === "COMPLETED") {
       const cycle = await Cycle.findByPk(cycleId);
       if (!cycle || cycle.status !== 'AVAILABLE') {
         throw new Error("Cycle is no longer available");
       }

       await Booking.create({ 
         user_id: req.user.userId, 
         cycle_id: cycleId, 
         status: 'ACTIVE',
         total_amount: amount,
         start_time: new Date(),
         payment_id: orderID 
       }, { transaction: t });

       await Cycle.update(
         { status: 'RENTED' }, 
         { where: { id: cycleId }, transaction: t }
       );
       
       await t.commit();
       res.json({ status: "success" });
    } else {
      res.status(400).json({ message: "Payment not completed" });
    }
  } catch (err) {
    await t.rollback();
    console.error("Capture Error:", err);
    res.status(500).json({ message: err.message || "Capture failed" });
  }
});

/**
 * 3. Extend Ride Route
 * Captures extra payment and updates the existing booking total
 */
router.post("/extend-ride", authRequired, async (req, res) => {
  const { orderID, bookingId, additionalAmount } = req.body;
  
  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  const t = await sequelize.transaction();

  try {
    // Fixed: Using 'client' to match the initialized PayPal client above
    const capture = await client.execute(request);

    if (capture.result.status === "COMPLETED") {
      const booking = await Booking.findByPk(bookingId);
      
      if (!booking) {
        await t.rollback();
        return res.status(404).json({ message: "Booking not found" });
      }

      // Numeric safety for currency addition
      const currentAmount = parseFloat(booking.total_amount) || 0;
      const extraAmount = parseFloat(additionalAmount) || 0;
      const newTotal = (currentAmount + extraAmount).toFixed(2);
      
      await booking.update({
        total_amount: newTotal
      }, { transaction: t });

      await t.commit();
      res.json({ status: "success", message: "Ride extended successfully!" });
    } else {
      res.status(400).json({ message: "PayPal payment not completed" });
    }
  } catch (err) {
    if (t) await t.rollback();
    console.error("Extension Error:", err);
    res.status(500).json({ message: "Backend failed to update the booking" });
  }
});

/**
 * 4. Return a Cycle (End the Rental)
 */
router.post("/return/:id", authRequired, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    await booking.update({ 
      status: 'COMPLETED',
      end_time: new Date() 
    }, { transaction: t });

    await Cycle.update(
      { status: 'AVAILABLE' },
      { where: { id: booking.cycle_id }, transaction: t }
    );

    await t.commit();
    res.json({ message: "Cycle returned successfully" });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: "Return process failed" });
  }
});

/**
 * 5. Get My History (Including Cycle Details)
 */
router.get("/my-history", authRequired, async (req, res) => {
  try {
    const history = await Booking.findAll({
      where: { user_id: req.user.userId },
      include: [{ 
        model: Cycle,
        attributes: ['model_name', 'hourly_rate', 'image_url'] 
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Error fetching history" });
  }
});

/**
 * 6. View Active Rentals
 */
router.get("/my-rentals", authRequired, async (req, res) => {
  try {
    const rentals = await Booking.findAll({
      where: { user_id: req.user.userId, status: 'ACTIVE' },
      include: [{ model: Cycle }]
    });
    res.json(rentals);
  } catch (err) {
    res.status(500).json({ message: "Error fetching rentals" });
  }
});

export default router;