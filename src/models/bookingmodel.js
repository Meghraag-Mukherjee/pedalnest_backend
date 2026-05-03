import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Booking = sequelize.define("Booking", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  cycle_id: { type: DataTypes.INTEGER, allowNull: false },
  start_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  end_time: { type: DataTypes.DATE },
  total_amount: { type: DataTypes.DECIMAL(10, 2) },
  status: { 
    type: DataTypes.ENUM("ACTIVE", "COMPLETED", "CANCELLED"), 
    defaultValue: "ACTIVE" 
  }
}, { tableName: "bookings", underscored: true });