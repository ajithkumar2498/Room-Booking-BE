import { sequelize } from "../config/DataBase.js";
import { DataTypes, Model } from "sequelize";

class IdempotencyKey extends Model {}
IdempotencyKey.init(
  {
    key: { 
        type: DataTypes.STRING, 
        primaryKey: true 
    },
    responseCode: { 
        type: DataTypes.INTEGER, 
        allowNull: true 
    },
    responseBody: { 
        type: DataTypes.TEXT, 
        allowNull: true 
    }, // Stored as JSON string
    locked: { 
        type: DataTypes.INTEGER, 
        defaultValue: 1 }, // 1 = locked, 0 = complete
  },
  { sequelize, modelName: "IdempotencyKey" }
);

export default IdempotencyKey