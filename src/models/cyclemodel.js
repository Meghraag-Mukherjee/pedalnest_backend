import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Cycle = sequelize.define("Cycle", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  model_name: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.ENUM("Mountain", "Road", "Electric","Hybrid"), defaultValue: "Road" },
  hourly_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: { type: DataTypes.ENUM("AVAILABLE", "RENTED", "MAINTENANCE"), defaultValue: "AVAILABLE" },
  image_url: {
  type: DataTypes.TEXT,
  field: "image_url",
  allowNull: true
}
}, { tableName: "cycles", underscored: true });