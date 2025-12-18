import * as bookingService from '../services/BookingService.js';
import * as idempotencyService from '../services/idempotencyService.js';
import { listBookings as listBookingsRepo } from '../repositories/BookingRepo.js'; 

export const createBooking = async (req, res, next) => {
  const key = req.get('Idempotency-Key');
  
  try {
    if (key) {
      const existing = await idempotencyService.checkIdempotency(key);
      if (existing) {
        if (existing.locked) {
          return res.status(409).json({ error: "Request in progress" });
        }
        return res.status(existing.responseCode).json(JSON.parse(existing.responseBody));
      }

      const locked = await idempotencyService.lockIdempotencyKey(key);
      if (!locked) {
        return res.status(409).json({ error: "Request conflict" });
      }

      try {
        const booking = await bookingService.createBooking(req.body);
        await idempotencyService.saveIdempotencyResult(key, 200, booking);
        return res.status(200).json(booking);
      } catch (err) {
        await idempotencyService.saveIdempotencyResult(key, err.statusCode || 500, { error: err.message });
        throw err;
      }
    } else {
      const booking = await bookingService.createBooking(req.body);
      res.status(200).json(booking);
    }
  } catch (err) {
    next(err);
  }
};

export const listBookings = async (req, res, next) => {
  try {
    const { roomId, from, to, limit, offset } = req.query;
    // Calling repo directly for read-only list as per common functional pattern 
    const result = await listBookingsRepo(roomId, from, to, limit, offset);
    res.json({
        items: result.items,
        total: result.total,
        limit: parseInt(limit || 10),
        offset: parseInt(offset || 0)
    });
  } catch (err) {
    next(err);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const result = await bookingService.cancelBooking(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};