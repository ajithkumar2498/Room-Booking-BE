Meeting Room Booking Service

A robust, RESTful API for managing meeting room reservations without conflicts.

Prerequisites

Node.js: v14 or higher

NPM: v6 or higher

🚀 Installation & Setup

Clone the repository (if not already downloaded).

Install Dependencies:
Run the following command in the project root to install required libraries (Express, Sequelize, SQLite3, Jest, etc.):

npm install


Environment Setup:
The application uses a local SQLite database, so no external database setup is required. The database file (database.sqlite) will be created automatically upon the first run.

🏃‍♂️ Running the Application

To start the server in development mode:

npm start


Server URL: http://localhost:3000 (Default)

Note: If you have configured a PORT environment variable, the URL will change accordingly (e.g., http://localhost:8000).

🧪 Running Tests

The project includes a comprehensive test suite using Jest.

To run all tests:

npm test


🔌 API Endpoints

1. Create a Room

Endpoint: POST /rooms

Description: Adds a new meeting room.

Body:

{
  "name": "Boardroom A",
  "capacity": 10,
  "floor": 1,
  "amenities": ["Projector", "WiFi"]
}


2. Create a Booking

Endpoint: POST /bookings

Description: Books a room. Validates business hours (Mon-Fri, 08:00-20:00) and prevents overlaps.

Headers:

Idempotency-Key (Optional): Unique string to prevent duplicate bookings on retry.

Body:

{
  "roomId": 1,
  "title": "Strategy Meeting",
  "organizerEmail": "manager@example.com",
  "startTime": "2025-10-30T10:00:00.000Z",
  "endTime": "2025-10-30T12:00:00.000Z"
}


3. List Rooms

Endpoint: GET /rooms

Query Params: minCapacity (int), amenity (string)

4. List Bookings

Endpoint: GET /bookings

Query Params: roomId, start_from, end_to

5. Cancel Booking

Endpoint: POST /bookings/:id/cancel

6. Utilization Report

Endpoint: GET /reports/room-utilization

Query Params: from (ISO Date), to (ISO Date)

📂 Project Structure

├── src/
│   ├── config/         # Database configuration
│   ├── controllers/    # Request handling logic
│   ├── models/         # Sequelize database models
│   ├── repositories/   # Direct database access layer
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic (Validation, Calculations)
│   └── index.js          # Entry point
├── tests/              # Integration tests
├── package.json
└── README.md
