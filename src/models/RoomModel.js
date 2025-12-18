import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/DataBase.js";

class Room extends Model {}

Room.init({
    name:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true
    },
    capacity:{
        type:DataTypes.INTEGER,
        allowNull:false,
        validate:{min:1}
    },
    floor:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    amenities:{
        type:DataTypes.TEXT,
        defaultValue:"[]",
        get() {
            const rawValue =  this.getDataValue('amenities');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value){
            this.setDataValue('amenities', JSON.stringify(value))
        }

    }
}, {sequelize, modelName:"Room"})

export default Room