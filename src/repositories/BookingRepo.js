import { Op } from "sequelize"
import { Booking } from "../models/index.js"



export const createBooking = async (bookingData)=>{
    return await Booking.create(bookingData)
}

export const findOverLappingBooking = async (roomId, start, end) =>{
    return await Booking.findOne({
        where:{
            roomId,
            status: 'confirmed',
            startTime: { [Op.lt]: end},
            endTime: { [Op.gt]: start}
        }
    })
}

export const listBookings = async (roomId, startFrom, endTo, limit=0, offset=0) =>{
    const where = {}
    if(roomId) where.roomId = roomId;
    if(startFrom) where.endTime = { [Op.gte]: startFrom}
    if(endTo) where.startTime = { [Op.lte]: endTo};

    const {count, rows} = await Booking.findAndCountAll({
        where,
        limit:parseInt(limit),
        offset:parseInt(offset),
        order: [['startTime', 'DESC']]
    })
    return {items: rows, total: count}
}

export const getBookingById = async (id) =>{
    return await Booking.findByPk(id)
}

export const updateBookingStatus = async (booking, status) =>{
    booking.status = status;
    return await booking.save()
}

export const getAllConfirmedBookingsInRange = async (start, end)=>{
    return await Booking.findAll({
        where:{
            status: 'confirmed',
            startTime: { [Op.lt]: end },
            endTime: { [Op.gt]: start }
        }
    })
}