import moment from 'moment';
import * as repo from '../repositories/BookingRepo.js';
import { getRoomById } from '../repositories/RoomRepository.js';

export const createBooking = async (data) => {
  console.log("CreateBooking Service received:", data);

  // Guard against undefined data (common cause of 500 errors)
  if (!data) {
    const err = new Error("Request body is empty or not parsed correctly");
    err.statusCode = 400;
    throw err;
  }

  // 1. Explicitly extract variables to ensure they are defined in scope
  const roomId = data.roomId;
  const startTime = data.startTime;
  const endTime = data.endTime;
  
  console.log("Processing booking for Room ID:", roomId); 

  if (!roomId) {
    const err = new Error("roomId is missing from request body");
    err.statusCode = 400;
    throw err;
  }

  // 2. Validate Room
  const room = await getRoomById(roomId);
  
  if (!room) {
    console.error(`Room with ID ${roomId} not found in DB`);
    const err = new Error("Room not found");
    err.statusCode = 404;
    throw err;
  }

  const start = moment(startTime);
  const end = moment(endTime);

  // 3. Time Validation
  if (!start.isValid() || !end.isValid()) {
    const err = new Error("Invalid Date format");
    err.statusCode = 400;
    throw err;
  }

  if (!start.isBefore(end)) {
    const err = new Error("startTime must be strictly before endTime");
    err.statusCode = 400;
    throw err;
  }

  const durationMinutes = end.diff(start, 'minutes');
  if (durationMinutes < 15 || durationMinutes > 240) {
    const err = new Error("Duration must be between 15 minutes and 4 hours");
    err.statusCode = 400;
    throw err;
  }

  if (start.isoWeekday() > 5 || end.isoWeekday() > 5) {
    const err = new Error("Bookings only allowed Mon-Fri");
    err.statusCode = 400;
    throw err;
  }

  const startHour = start.hour();
  const endHour = end.hour();
  const endMinute = end.minute();

  if (startHour < 8 || endHour > 20 || (endHour === 20 && endMinute > 0)) {
    const err = new Error("Bookings only allowed between 08:00 and 20:00");
    err.statusCode = 400;
    throw err;
  }

  // 4. Overlap Check
  const overlap = await repo.findOverLappingBooking(roomId, start.toDate(), end.toDate());
  if (overlap) {
    const err = new Error("Room is already booked for this time slot");
    err.statusCode = 409;
    throw err;
  }

  return await repo.createBooking(data);
};

export const cancelBooking = async (id) => {
  const booking = await repo.getBookingById(id);
  if (!booking) {
    const err = new Error("Booking not found");
    err.statusCode = 404;
    throw err;
  }

  if (booking.status === 'cancelled') return booking;

  const limit = moment(booking.startTime).subtract(1, 'hours');
  if (moment().isAfter(limit)) {
    const err = new Error("Cannot cancel within 1 hour of start time");
    err.statusCode = 400;
    throw err;
  }

  return await repo.updateBookingStatus(booking, 'cancelled');
};

export const generateUtilizationReport = async (fromDate, toDate) => {
  const startWindow = moment(fromDate);
  const endWindow = moment(toDate);

  let totalBusinessHours = 0.0;
  let current = startWindow.clone();

  while (current.isBefore(endWindow)) {
    if (current.isoWeekday() <= 5) {
      const dayStart = current.clone().hour(8).minute(0).second(0).millisecond(0);
      const dayEnd = current.clone().hour(20).minute(0).second(0).millisecond(0);

      const effStart = moment.max(current, dayStart);
      
      let windowEndOrDayEnd = dayEnd;
      if (endWindow.isSame(current, 'day') && endWindow.isBefore(dayEnd)) {
          windowEndOrDayEnd = endWindow;
      }

      const effEnd = windowEndOrDayEnd; 

      if (effEnd.isAfter(effStart)) {
        totalBusinessHours += effEnd.diff(effStart, 'hours', true);
      }
    }
    current.add(1, 'days').startOf('day');
  }

  if (totalBusinessHours === 0) return [];

  const bookings = await repo.getAllConfirmedBookingsInRange(startWindow.toDate(), endWindow.toDate());
  const { listRooms } = await import('../repositories/RoomRepository.js');
  const allRooms = await listRooms();
  
  const roomHours = {};

  bookings.forEach(b => {
    const bStart = moment.max(moment(b.startTime), startWindow);
    const bEnd = moment.min(moment(b.endTime), endWindow);
    const duration = bEnd.diff(bStart, 'seconds');
    
    if (duration > 0) {
      roomHours[b.roomId] = (roomHours[b.roomId] || 0) + duration;
    }
  });

  return allRooms.map(r => {
    const seconds = roomHours[r.id] || 0;
    const hours = seconds / 3600.0;
    const util = hours / totalBusinessHours;
    return {
      roomId: r.id,
      roomName: r.name,
      totalBookingHours: Number(hours.toFixed(2)),
      utilizationPercent: Number(util.toFixed(2))
    };
  });
};