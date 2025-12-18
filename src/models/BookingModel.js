import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/DataBase.js";

class Booking extends Model {}
Booking.init({
  title: { type: DataTypes.STRING, allowNull: false },
  organizerEmail: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
  startTime: { type: DataTypes.DATE, allowNull: false },
  endTime: { type: DataTypes.DATE, allowNull: false },
  status: { 
    type: DataTypes.ENUM('confirmed', 'cancelled'), 
    defaultValue: 'confirmed' 
  }
}, { sequelize, modelName: 'Booking' });


export default Booking