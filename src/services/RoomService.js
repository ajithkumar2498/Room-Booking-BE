import * as repo from '../repositories/RoomRepository.js';

export const createRoom = async (data) => {
  const existing = await repo.getRoomByName(data.name);
  if (existing) {
    if(existing.name.toLowerCase() === data.name.toLowerCase()) {
       const error = new Error("Room with this name already exists");
       error.statusCode = 400;
       throw error;
    }
  }
  return await repo.createRoom(data);
};

export const listRooms = async (minCapacity, amenity) => {
  return await repo.listRooms(minCapacity, amenity);
};