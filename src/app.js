import express from "express";
import cors from "cors";
import authRoutes from "./routes/authroutes.js";
import cycleRoutes from "./routes/cycleroutes.js";
import bookingRoutes from "./routes/bookingroutes.js";
import { sequelize } from "./config/db.js";

// Import Models
import { User } from "./models/usermodel.js";
import { Cycle } from "./models/cyclemodel.js";
import { Booking } from "./models/bookingmodel.js";

const app = express();

// Middleware
app.use(cors({
  origin: "https://pedalnest-frontend.vercel.app/login", 
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/cycles", cycleRoutes);
app.use("/api/bookings", bookingRoutes);

// Simple health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// --- DEFINE ASSOCIATIONS (No-Constraint Mode) ---
// Using constraints: false allows Sequelize to join tables in code 
// without needing 'REFERENCES' permissions in the database.

// Relationship between User and Booking
User.hasMany(Booking, { foreignKey: "user_id", constraints: false });
Booking.belongsTo(User, { foreignKey: "user_id", constraints: false });

// Relationship between Cycle and Booking
Cycle.hasMany(Booking, { foreignKey: "cycle_id", constraints: false });
Booking.belongsTo(Cycle, { foreignKey: "cycle_id", constraints: false });

// DB connect + sync
const initDb = async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    // Syncing with 'alter: true' will now skip the failing Foreign Key commands
    await sequelize.sync(); 
    console.log("DB synced successfully without permission errors");
  } catch (err) {
    console.error("DB error:", err);
  }
};

initDb();

export default app;