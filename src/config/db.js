import { Sequelize } from "sequelize";
import { env } from "./env.js";

// We pass the parameters individually instead of as one long URL string
export const sequelize = new Sequelize(
  env.dbName,     // 'test'
  env.dbUser,     // 'rhYyokg3ufEFofR.root'
  env.dbPassword, // 'M1dD3dLzrnmbiWbv'
  {
    host: env.dbHost,
    port: env.dbPort,
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
      }
    }
  }
);