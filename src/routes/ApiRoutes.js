import express from 'express';
import { createRoom, listRooms } from '../controllers/RoomController.js';
import { createBooking, listBookings, cancelBooking } from '../controllers/BookingController.js';
import { getReport } from '../controllers/ReportController.js';

const router = express.Router();

const validateHandler = (handler, name) => {
  if (typeof handler !== 'function') {
    console.error(`CRITICAL ERROR: Controller function '${name}' is ${typeof handler}.`);
    console.error(`   Likely cause: The file exporting '${name}' is missing 'export const ${name} = ...'`);
    console.error(`   Please check src/controllers/ for correct exports.\n`);
    // Return a dummy function to prevent crash so you can see the log
    return (req, res) => res.status(500).json({ error: `Configuration Error: ${name} is missing` });
  }
  return handler;
};

// -- Rooms --
// If createRoom is undefined, this line will now throw a specific ReferenceError
router.post('/rooms', validateHandler(createRoom, "createRoom"));
router.get('/rooms', validateHandler(listRooms, "listRooms"));

// -- Bookings --
router.post('/bookings', validateHandler(createBooking, "createBooking"));
router.get('/bookings', validateHandler(listBookings, "listBookings"));
router.post('/bookings/:id/cancel', validateHandler(cancelBooking, "cancelBooking"));

// -- Reports --
router.get('/reports/room-utilization', validateHandler(getReport, "getReport"));

export default router;