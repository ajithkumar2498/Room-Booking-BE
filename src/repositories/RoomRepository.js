import { Op } from "sequelize"
import { Room } from "../models/index.js"



export const createRoom = async (roomData)=>{
    return await Room.create(roomData)
}

export const getRoomByName = async (name)=>{
    return await Room.findOne({where:{
        name: { [Op.like]: name}
    }})
}

export const getRoomById = async (id)=>{
    return await Room.findByPk(id)
}


export const listRooms = async (minCapacity, amenity)=>{
    const where = {};
    if(minCapacity) where.capacity = { [Op.gte]: minCapacity}

    let rooms = await Room.findAll({where})

    if(amenity){
        const lowerAmenity = amenity.toLowerCase()
        rooms = rooms.filter( r=> 
            r.amenities.some(a=> a.toLowerCase() === lowerAmenity)
        )
    }
    return rooms
}