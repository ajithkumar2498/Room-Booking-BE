Meeting Room Booking Service

A robust, RESTful API designed to manage meeting room reservations with zero conflicts. Built with Node.js and Express.

Tech Stack
----------

Core: Node.js, Express.js

Database: SQLite (with Sequelize ORM)

Testing: Jest, Supertest

Setup & Run
-----------

Install Dependencies

npm install


Start Server

npm start


The API runs at http://localhost:8000.

Run Tests

npm test

Key Features
------------

Conflict-Free Booking: Automatically prevents double bookings and enforces business hours (Mon-Fri, 08:00–20:00).

Idempotency: Handles network retries safely using the Idempotency-Key header.

Reports: Generates room utilization statistics based on business hours.

Layered Architecture: Clean separation of Controllers, Services, and Repositories.

API Quick Reference

Method

Endpoint

Description

POST

/rooms

Create a new room

GET

/rooms

List rooms (filter by capacity/amenity)

POST

/bookings

Create a booking

GET

/bookings

List bookings

POST

/bookings/:id/cancel

Cancel a booking

GET

/reports/room-utilization

Get utilization stats

Built for the HCL GUVI x Everquint FSD Task.