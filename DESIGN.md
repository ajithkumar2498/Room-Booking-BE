System Design: Meeting Room Booking Service

1. Data Model

The application uses a relational database (SQLite) accessed via Sequelize ORM.

Room

id (PK): Integer, Auto-increment.

name: String, Unique.

capacity: Integer.

floor: Integer.

amenities: String (Stored as JSON array string).

Booking

id (PK): Integer.

roomId (FK): References Room.

title: String.

organizerEmail: String.

startTime: DateTime (ISO 8601).

endTime: DateTime (ISO 8601).

status: Enum (confirmed, cancelled).

IdempotencyKey

key: String (PK).

responseCode: Integer (HTTP Status).

responseBody: Text (JSON string of the response).

locked: Integer (1 = processing, 0 = complete).

2. Preventing Overlaps

We enforce a strict "No Overlap" policy using a time-range intersection check before any booking insertion.

Logic:
A new booking $(Start_{new}, End_{new})$ conflicts with an existing booking $(Start_{exist}, End_{exist})$ if:


$$Start_{new} < End_{exist} \quad \text{AND} \quad End_{new} > Start_{exist}$$

This query is executed against the database for the specific roomId. If any confirmed record is found, the system immediately aborts with a 409 Conflict error.

3. Error Handling Strategy

The application uses a Centralized Error Handling middleware pattern in Express.js.

Throwing Errors: Services throw standard JavaScript Error objects attached with a custom statusCode property (e.g., err.statusCode = 404).

Catching Errors: Controllers wrap logic in try/catch blocks and pass errors to next(err).

Formatting: The global middleware intercepts these errors and formats a consistent JSON response:

{
  "error": "ValidationError",
  "message": "Specific details about what went wrong"
}


4. Idempotency Implementation

To ensure network retries do not create duplicate bookings, clients can send a custom Idempotency-Key header.

Flow:

Check: Middleware checks the database for the key.

Found & Locked: Request is currently processing. Return 409 Conflict.

Found & Unlocked: Request previously succeeded. Return the cached responseBody and statusCode.

Lock: If the key is new, a record is inserted with locked=1.

Process: The booking logic executes.

Save: On completion, the record is updated with the result and locked=0.

5. Concurrency Handling

Idempotency Locks: The database unique constraint on the IdempotencyKey table acts as a concurrency lock. If two requests with the same key arrive simultaneously, the database rejects the second insertion, preventing duplicate processing.

Booking Integrity: While the current implementation uses a "Check-Then-Act" logic in the application layer, production environments would rely on database transaction isolation levels (Serializable) or Exclusion Constraints (PostgreSQL) to strictly guarantee no race conditions occur between the overlap check and the insertion.

6. Utilization Calculation

The utilization report calculates how efficiently rooms are used during business hours.

Formula:
$$ \text{Utilization} = \frac{\text{Total Duration of Confirmed Bookings (in range)}}{\text{Total Business Hours Available (in range)}} $$

Assumptions & Logic:

Business Hours: Strictly Monday–Friday, 08:00 to 20:00 (12 hours/day).

Range Clipping: If a user requests a report from 10:00 to 11:00, only the booking time falling within that specific window contributes to the numerator.

Denominator: The system iterates through the requested date range, summing up 12 hours for every weekday found, excluding weekends.