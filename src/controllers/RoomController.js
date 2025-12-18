import * as service from '../services/RoomService.js';

export const createRoom = async (req, res, next) => {
  try {
    const room = await service.createRoom(req.body);
    res.status(200).json(room);
  } catch (err) {
    next(err);
  }
};

export const listRooms = async (req, res, next) => {
  try {
    const { minCapacity, amenity } = req.query;
    const rooms = await service.listRooms(minCapacity, amenity);
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};