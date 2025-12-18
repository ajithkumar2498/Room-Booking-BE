import Booking from "./BookingModel.js";
import Room from "./RoomModel.js";
import { sequelize } from "../config/DataBase.js";
import IdempotencyKey from "./IdempotencyKey.js";



Room.hasMany(Booking, {foreignKey: "roomId"})
Booking.belongsTo(Room, {foreignKey:'roomId'})
export {sequelize, Room, Booking, IdempotencyKey}