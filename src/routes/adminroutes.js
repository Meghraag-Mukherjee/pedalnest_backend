import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { Booking } from "../models/bookingmodel.js";
import { Cycle } from "../models/cyclemodel.js";
import sequelize from "../config/db.js";

const router = Router();

// Middleware to check if user is ADMIN
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ message: "Admin access denied" });
  next();
};

router.get("/analytics", authRequired, adminOnly, async (req, res) => {
  try {
    // 1. Calculate Total Revenue
    const totalRevenue = await Booking.sum('total_amount') || 0;

    // 2. Count Total Bookings
    const totalRides = await Booking.count();

    // 3. Count Available vs Rented Cycles
    const cycleStats = await Cycle.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    // 4. Calculate CO2 Saved (Logic: 0.4kg per ride/hour)
    const co2Saved = (totalRides * 0.4).toFixed(2);

    res.json({
      totalRevenue,
      totalRides,
      co2Saved,
      cycleStats
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching analytics" });
  }
});

export default router;