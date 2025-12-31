import moment from "moment";
import * as repo from "../repositories/BookingRepo.js";
import { findOverLappingBooking } from "../repositories/BookingRepo.js";
import { getRoomById } from "../repositories/RoomRepository.js";
import { listRooms } from "../repositories/RoomRepository.js"

// Basic Email Regex validation
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const createBooking = async (data) => {
  console.log("CreateBooking Service received:", data);

  if (!data) {
    const err = new Error("Request body is empty");
    err.statusCode = 400;
    throw err;
  }

  // 1. Destructure & Check Existence of all required fields
  const { roomId, title, organizerEmail, startTime, endTime } = data;

  if (!roomId) throw { statusCode: 400, message: "roomId is required" };
  if (!title || title.trim() === "")
    throw { statusCode: 400, message: "Booking title is required" };
  if (!organizerEmail || !isValidEmail(organizerEmail))
    throw { statusCode: 400, message: "Valid organizerEmail is required" };
  if (!startTime || !endTime)
    throw { statusCode: 400, message: "startTime and endTime are required" };

  // 2. Validate Room existence
  const room = await getRoomById(roomId);
  if (!room) {
    const err = new Error(`Room with ID ${roomId} not found`);
    err.statusCode = 404;
    throw err;
  }

  // 3. Time Parsing & Logic
  const start = moment(startTime);
  const end = moment(endTime);

  // Validate ISO 8601 format
  if (!start.isValid())
    throw {
      statusCode: 400,
      message: "Invalid startTime format (ISO 8601 expected)",
    };
  if (!end.isValid())
    throw {
      statusCode: 400,
      message: "Invalid endTime format (ISO 8601 expected)",
    };

  // Ensure start is before end
  if (!start.isBefore(end)) {
    throw {
      statusCode: 400,
      message: "startTime must be strictly before endTime",
    };
  }

  // 4. Duration Validation (15m - 4h)
  const durationMinutes = end.diff(start, "minutes");
  if (durationMinutes < 15)
    throw {
      statusCode: 400,
      message: "Booking duration must be at least 15 minutes",
    };
  if (durationMinutes > 240)
    throw {
      statusCode: 400,
      message: "Booking duration cannot exceed 4 hours",
    };

  // 5. Business Hours (Mon-Fri, 08:00-20:00)
  // isoWeekday: 1 (Mon) - 7 (Sun)
  if (start.isoWeekday() > 5 || end.isoWeekday() > 5) {
    throw {
      statusCode: 400,
      message: "Bookings are allowed only Monday to Friday",
    };
  }

  const startHour = start.hour();
  const endHour = end.hour();
  const endMinute = end.minute();

  // Rules: Start >= 8, End <= 20 (If End is 20, minute must be 0)
  const isStartValid = startHour >= 8 && startHour < 20;
  // End is valid if it's < 20, OR if it's exactly 20:00
  const isEndValid =
    (endHour < 20 && endHour >= 8) || (endHour === 20 && endMinute === 0);

  if (!isStartValid || !isEndValid) {
    throw {
      statusCode: 400,
      message: "Bookings allowed only between 08:00 and 20:00",
    };
  }

  // 6. Overlap Check
  // Ensure no existing confirmed booking overlaps with the requested time
  const overlap = await findOverLappingBooking(
    roomId,
    start.toDate(),
    end.toDate()
  );
  if (overlap) {
    const err = new Error("Room is already booked for this time slot");
    err.statusCode = 409;
    throw err;
  }

  // 7. Create Booking
  return await repo.createBooking(data);
};

export const cancelBooking = async (id) => {
  const booking = await repo.getBookingById(id);
  if (!booking) {
    const err = new Error("Booking not found");
    err.statusCode = 404;
    throw err;
  }

  if (booking.status === "cancelled") return booking;

  // Cancellation Rule: Must be cancelled > 1 hour before start time
  const cutoffTime = moment(booking.startTime).subtract(1, "hours");

  // Note: Using moment() gets current time
  if (moment().isAfter(cutoffTime)) {
    const err = new Error("Cannot cancel within 1 hour of start time");
    err.statusCode = 400;
    throw err;
  }

  return await repo.updateBookingStatus(booking, "cancelled");
};

export const generateUtilizationReport = async (fromDate, toDate) => {
  const startWindow = moment(fromDate);
  const endWindow = moment(toDate);

  if (!startWindow.isValid() || !endWindow.isValid()) {
    throw { statusCode: 400, message: "Invalid date parameters" };
  }

  let totalBusinessHours = 0.0;
  let current = startWindow.clone();

  // Calculate denominator: Total available business hours in the range
  while (current.isBefore(endWindow)) {
    if (current.isoWeekday() <= 5) {
      // Mon-Fri
      const dayStart = current
        .clone()
        .hour(8)
        .minute(0)
        .second(0)
        .millisecond(0);
      const dayEnd = current
        .clone()
        .hour(20)
        .minute(0)
        .second(0)
        .millisecond(0);

      // Intersection of [current, endWindow] and [dayStart, dayEnd]
      const effStart = moment.max(current, dayStart);

      let windowEndOrDayEnd = dayEnd;

      // Check boundaries for the current day iteration
      if (endWindow.isSame(current, "day") && endWindow.isBefore(dayEnd)) {
        windowEndOrDayEnd = endWindow;
      } else if (
        endWindow.isBefore(dayEnd) &&
        endWindow.date() === current.date()
      ) {
        windowEndOrDayEnd = endWindow;
      }

      const effEnd = windowEndOrDayEnd;

      if (effEnd.isAfter(effStart)) {
        totalBusinessHours += effEnd.diff(effStart, "hours", true);
      }
    }
    // Move to start of next day
    current.add(1, "days").startOf("day");
  }

  if (totalBusinessHours === 0) return [];

  const bookings = await repo.getAllConfirmedBookingsInRange(
    startWindow.toDate(),
    endWindow.toDate()
  );
  // const {  } = await import("../repositories/RoomRepository.js");
  const allRooms = await listRooms();

  const roomHours = {};

  bookings.forEach((b) => {
    // Clip booking duration to the requested report window
    const bStart = moment.max(moment(b.startTime), startWindow);
    const bEnd = moment.min(moment(b.endTime), endWindow);
    const duration = bEnd.diff(bStart, "seconds");

    if (duration > 0) {
      roomHours[b.roomId] = (roomHours[b.roomId] || 0) + duration;
    }
  });

  return allRooms.map((r) => {
    const seconds = roomHours[r.id] || 0;
    const hours = seconds / 3600.0;
    const util = hours / totalBusinessHours;
    return {
      roomId: r.id,
      roomName: r.name,
      totalBookingHours: Number(hours.toFixed(2)),
      utilizationPercent: Number(util.toFixed(2)),
    };
  });
};
