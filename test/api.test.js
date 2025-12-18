import request from 'supertest';
import app from '../src/index.js';
import { sequelize } from '../src/models/index.js';
import moment from 'moment';

// Jest Hooks: Ensure DB is clean before running tests
beforeAll(async () => {
  // force: true drops tables and recreates them
  await sequelize.sync({ force: true });
});

afterAll(async () => {
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

  test('Create Room Duplicate', async () => {
    const res = await request(app)
      .post('/rooms')
      .send({ name: 'Room A', capacity: 5, floor: 1 });
    expect(res.statusCode).toEqual(400); // Expect Bad Request or similar
  });

  test('Create Booking Success', async () => {
    // Next Monday 10:00 AM
    const start = moment().day(1).add(1, 'weeks').hour(10).minute(0).second(0).toISOString();
    // Next Monday 12:00 PM
    const end = moment().day(1).add(1, 'weeks').hour(12).minute(0).second(0).toISOString();

    const res = await request(app)
      .post('/bookings')
      .send({
        roomId,
        title: 'Team Sync',
        organizerEmail: 'test@test.com',
        startTime: start,
        endTime: end
      });
    
    // Debug log if test fails
    if (res.statusCode !== 200) {
      console.log('Create Booking Failed:', res.body);
    }
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('confirmed');
  });

  test('Create Booking Conflict', async () => {
    // Overlap Next Monday 11:00 AM - 1:00 PM (Overlaps 11-12)
    const start = moment().day(1).add(1, 'weeks').hour(11).minute(0).second(0).toISOString();
    const end = moment().day(1).add(1, 'weeks').hour(13).minute(0).second(0).toISOString();

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

  test('Idempotency', async () => {
    const key = 'unique-key-123';
    // Next Tuesday 2:00 PM
    const start = moment().day(2).add(1, 'weeks').hour(14).minute(0).second(0).toISOString();
    const end = moment().day(2).add(1, 'weeks').hour(15).minute(0).second(0).toISOString();
    
    const payload = {
        roomId,
        title: 'Idemp Test',
        organizerEmail: 'i@i.com',
        startTime: start,
        endTime: end
    };

    // First Call
    const res1 = await request(app)
      .post('/bookings')
      .set('Idempotency-Key', key)
      .send(payload);
    expect(res1.statusCode).toEqual(200);

    // Second Call (Same Key)
    const res2 = await request(app)
      .post('/bookings')
      .set('Idempotency-Key', key)
      .send(payload);
    
    // Should return success (cached response) and same ID
    expect(res2.statusCode).toEqual(200);
    expect(res2.body.id).toEqual(res1.body.id);
  });

  test('Utilization Report', async () => {
    // Report for next Monday (where we made the 'Team Sync' booking)
    const monday = moment().day(1).add(1, 'weeks');
    const from = monday.clone().startOf('day').toISOString();
    const to = monday.clone().endOf('day').toISOString();

    const res = await request(app)
      .get(`/reports/room-utilization?from=${from}&to=${to}`);
    
    expect(res.statusCode).toEqual(200);
    
    // Find our specific room in the report
    const item = res.body.find(r => r.roomId === roomId);
    expect(item).toBeDefined();
    
    // We booked 2 hours (10-12). Business day is 12 hours (8-20).
    // Utilization = 2 / 12 = ~0.17
    expect(item.totalBookingHours).toEqual(2);
    expect(item.utilizationPercent).toEqual(0.17);
  });
});