import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: process.env.PORT || 4000,
  dbHost: process.env.DB_HOST,
  dbPort: process.env.DB_PORT || 4000,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME || "test",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET
};