import request from 'supertest';
import app from '../src/index.js';
import { jest, describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { sequelize } from '../src/models/index.js';
import moment from 'moment';

// Increase timeout for database operations
jest.setTimeout(30000);

beforeAll(async () => {
  // Sync DB and clear tables
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // CRITICAL: Close DB connection to prevent Jest hang/teardown errors
  await sequelize.close();
});

describe('Meeting Room API', () => {
  let roomId;

  test('Create Room', async () => {
    const res = await request(app)
      .post('/rooms')
      .send({
        name: 'Room A',
        capacity: 10,
        floor: 1,
        amenities: ['Projector', 'Whiteboard']
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id');
    roomId = res.body.id;
  });

  test('Create Booking Success', async () => {
    // Next Monday 10:00 AM
    const start = moment().day(8).hour(10).minute(0).second(0).toISOString();
    // Next Monday 12:00 PM
    const end = moment().day(8).hour(12).minute(0).second(0).toISOString();

    const res = await request(app)
      .post('/bookings')
      .send({
        roomId,
        title: 'Team Sync',
        organizerEmail: 'test@test.com',
        startTime: start,
        endTime: end
      });
    
    if (res.statusCode !== 200) console.log("Booking Failed:", res.body);
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('confirmed');
  });

  test('Create Booking Conflict', async () => {
    // Overlap Next Monday 11:00 AM - 1:00 PM
    const start = moment().day(8).hour(11).minute(0).second(0).toISOString();
    const end = moment().day(8).hour(13).minute(0).second(0).toISOString();

    const res = await request(app)
      .post('/bookings')
      .send({
        roomId,
        title: 'Overlap',
        organizerEmail: 'b@b.com',
        startTime: start,
        endTime: end
      });
    expect(res.statusCode).toEqual(409); // Conflict
  });

  test('Input Validation', async () => {
    // Missing title
    const res = await request(app).post('/bookings').send({
      roomId,
      organizerEmail: 'test@test.com',
      startTime: moment().toISOString(),
      endTime: moment().add(1, 'h').toISOString()
    });
    expect(res.statusCode).toEqual(400);
  });

  test('Utilization Report', async () => {
    const monday = moment().day(8);
    const from = monday.clone().startOf('day').toISOString();
    const to = monday.clone().endOf('day').toISOString();

    const res = await request(app)
      .get(`/reports/room-utilization?from=${from}&to=${to}`);
    
    expect(res.statusCode).toEqual(200);
    const item = res.body.find(r => r.roomId === roomId);
    expect(item).toBeDefined();
    // 2 hours booked / 12 business hours = ~0.17
    expect(item.totalBookingHours).toEqual(2);
    expect(item.utilizationPercent).toEqual(0.17);
  });
});