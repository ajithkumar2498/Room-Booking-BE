> Meeting Room Booking Service 📅

A robust, RESTful API designed to manage meeting room reservations efficiently. It features strict conflict prevention, idempotency support, and utilization reporting, built with Node.js, Express, and SQLite.

🚀 **Features**

Conflict-Free Booking: Enforces strict "No Overlap" checks using database queries before confirmation.

Business Rules: Validates booking duration (15m–4h) and operating hours (Mon–Fri, 08:00–20:00).

Idempotency: Handles network retries safely via Idempotency-Key headers to prevent duplicate bookings.

Utilization Reporting: Calculates room usage statistics based on effective business hours.

Layered Architecture: Clean separation of concerns (Controllers ↔ Services ↔ Repositories).

📋 **Prerequisites**

Node.js: v14 or higher

NPM: v6 or higher

🛠️ Installation & Setup

Clone the repository:

``` 
git clone https://github.com/ajithkumar2498/Room-Booking-BE.git
```

```
cd meeting-room-booking
```

**Install Dependencies:**

```
npm install
```


**Database:**
The application uses SQLite. The database file (database.sqlite) is automatically created in the root directory upon the first launch. No external configuration is required.

🏃‍♂️ **Running the Application**

Development Mode (Auto-Reload)

Starts the server using Nodemon, which restarts automatically on file changes.

```
npm run dev
```


**Production / Standard Start**

Starts the server using standard Node.js.

```
npm start
```


**Server URL:** http://localhost:3000 (Default)

Note: Port can be configured via the PORT environment variable.

🧪 **Running Tests**

The project includes a comprehensive integration test suite using Jest and Supertest.

```
npm test
```


🔌 **API Reference**

1. **Rooms**

POST /rooms: Create a new meeting room.

GET /rooms: List rooms (supports filtering by minCapacity and amenity).

2. **Bookings**

POST /bookings: Create a booking.

Headers: Idempotency-Key (Optional unique string).

Body: roomId, title, organizerEmail, startTime, endTime.

GET /bookings: List bookings (filter by roomId or date range).

POST /bookings/:id/cancel: Cancel an existing booking.

3. **Reports**

GET /reports/room-utilization: Get utilization stats (percentage of time booked vs. available business hours).

Query: from (ISO Date), to (ISO Date).

📂 **Project Structure**

src/

`├── config/         # Database connection setup`

`├── controllers/    # Request handling and response formatting`

`├── services/       # Business logic (Validation, Overlap checks)`

`├── repositories/   # Database queries (Sequelize)`

`├── models/         # Database Schema Definitions`

`├── routes/         # API Route definitions`

`└── index.js        # App entry point`


📐 **System Design**

For a deep dive into the architectural decisions, concurrency handling, and algorithms used (like the utilization formula), please refer to the DESIGN.md file.
