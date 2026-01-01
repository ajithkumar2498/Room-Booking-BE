System Design: Meeting Room Booking Service

1. Architecture Overview

The application follows a Layered Architecture (Controller-Service-Repository) to ensure separation of concerns, testability, and maintainability.

Controllers (src/controllers): Handle HTTP requests, parse inputs, and send responses. No business logic resides here.

Services (src/services): Contain the core business logic (e.g., validation rules, utilization calculations, overlap checks).

Repositories (src/repositories): Abstract the database layer. All Sequelize/SQL queries are isolated here.

Models (src/models): Define the database schema using Sequelize.

2. Data Model

We use SQLite with Sequelize ORM for data persistence.

Entities

Room

id (PK): Auto-increment Integer.

name: String (Unique).

capacity: Integer.

floor: Integer.

amenities: String (Stored as a JSON-stringified array for SQLite compatibility).

Booking

id (PK): Auto-increment Integer.

roomId (FK): Links to Room.

title: String.

organizerEmail: String.

startTime: DateTime (ISO 8601).

endTime: DateTime (ISO 8601).

status: Enum (confirmed, cancelled).

IdempotencyKey

key: String (PK).

responseCode: Integer.

responseBody: Text (JSON).

locked: Integer (1 = processing, 0 = complete).

3. Algorithm: preventing Overlaps

To ensure no two bookings occupy the same room at the same time, we perform a database check before insertion.

Logic:
A new booking request $(Start_{new}, End_{new})$ overlaps with an existing confirmed booking $(Start_{exist}, End_{exist})$ if:

$$Start_{new} < End_{exist} \quad \text{AND} \quad End_{new} > Start_{exist}$$

Implementation:

This query is executed in bookingRepository.js.

We use Sequelize operators Op.lt (less than) and Op.gt (greater than).

If any record is found, the service throws a 409 Conflict error immediately.

4. Idempotency & Concurrency

Idempotency

To handle network retries safely (e.g., a client sends the same booking request twice due to a timeout), we use the Idempotency-Key header.

Check: When a request arrives, we check the IdempotencyKeys table.

Hit:

If locked=1 (Processing): Return 409 Conflict (Concurrent request).

If locked=0 (Complete): Return the cached response immediately without re-processing logic.

Miss: Create a new key record with locked=1 and proceed to create the booking.

Save: Once the booking is created, update the key record with the response body and set locked=0.

Concurrency

Database Constraints: The IdempotencyKey.key is a Primary Key. If two parallel requests try to insert the same key, the database throws a constraint violation, ensuring only one proceeds.

Isolation: For booking overlaps, strict ACID transactions would be used in a production environment (e.g., PostgreSQL SERIALIZABLE isolation). In this SQLite implementation, the atomic nature of the single-threaded Node.js event loop + await calls provides sufficient safety for the scope of this assignment.

5. Utilization Report Calculation

The goal is to calculate the percentage of time a room is booked during business hours.

Formula:


$$\text{Utilization} = \frac{\text{Total Duration of Bookings (in range)}}{\text{Total Business Hours (in range)}}$$

Assumptions & Logic:

Business Hours: Fixed at Monday–Friday, 08:00 to 20:00 (12 hours/day).

Range Clipping:

The calculation iterates through every day in the requested from - to range.

Weekends (Sat/Sun) contribute 0 hours to the denominator.

Weekdays contribute up to 12 hours.

Booking Intersection:

We fetch all bookings overlapping the requested range.

We clip the booking duration. For example, if a booking is from 09:00 to 11:00, but the report is requested starting at 10:00, only 1 hour (10:00-11:00) is counted.

6. Error Handling Strategy

We adhere to a consistent error response format to make API consumption predictable.

Service Layer: Throws JavaScript Error objects with a custom statusCode property (e.g., error.statusCode = 404).

Controller Layer: Catches errors and passes them to the Express next() function.

Global Middleware: A centralized error handler in src/index.js formats the final JSON:

```
{
  "error": "ValidationError", // or InternalServerError, etc.
  "message": "startTime must be strictly before endTime"
}
```