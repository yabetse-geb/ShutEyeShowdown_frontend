# API Specification: Password Concept


[@api-extraction-from-code](../tools/api-extraction-from-code.md)

[@api-extraction-from-spec](../tools/api-extraction-from-spec.md)

Please extract an API spec for this updated [@PasswordAuth](PasswordAuth/PasswordAuth.md) concept and implementation, [@implementation](design/concepts/PasswordAuth/implementation.md)

## PasswordAuth

Specification:

[@PasswordAuth](PasswordAuth/PasswordAuth.md)

Code:

[@implementation](PasswordAuth/implementation.md)

## API Endpoints

### POST /api/Accountability/_getAccountabilitySeekersForUser

**Description:** Retrieves the list of users who have designated the given mentor as their partner.

**Requirements:**
- `mentor` must be a valid user ID.

**Effects:**
- Returns the list of `user` IDs from `Partnerships` where `{ partner: mentor }`.

**Request Body:**
```json
{
  "mentor": "string"
}
```

**Success Response Body (Query):**
```json
[
  "string"
]
```

**Error Response Body:**
```json
{
  "error": "string"
}

### POST /api/Accountability/addPartner

**Description:** Creates a new accountability partnership between two users with specified notification settings.

**Requirements:**
- The `user` and `partner` must not be the same.
- A partnership between this `user` and `partner` must not already exist.

**Effects:**
- A new `Partnership` record is created with the given `user`, `partner`, `notifyTypes`, `reportFrequency`, and a `lastReportDate` of null.
 - A new `Reports` record is created with `(user: partner, accountabilitySeeker: user, allReports: [])`.

**Request Body:**
```json
{
  "user": "string",
  "partner": "string",
  "notifyTypes": ["string"],
  "reportFrequency": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

### POST /api/Accountability/_getAllReports

**Description:** Retrieves the stored list of report strings for a given `(user, accountabilitySeeker)` pair.

**Requirements:**
- Both `user` and `accountabilitySeeker` must be valid user IDs.

**Effects:**
- Looks up the `Reports` document where `{ user, accountabilitySeeker }` and returns `allReports` (empty list if none).

**Request Body:**
```json
{
  "user": "string",
  "accountabilitySeeker": "string"
}
```

**Success Response Body (Query):**
```json
[
  "string"
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

### POST /api/Accountability/removePartner

**Description:** Removes an existing accountability partnership.

**Requirements:**
- A partnership must exist between the given `user` and `partner`.

**Effects:**
- The `Partnership` record matching the `user` and `partner` is removed.
 - The corresponding `Reports` record with `(user: partner, accountabilitySeeker: user)` is removed.

**Request Body:**
```json
{
  "user": "string",
  "partner": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

### POST /api/Accountability/updatePreferences

**Description:** Updates the notification settings for an existing partnership.

**Requirements:**
- A partnership must exist between the given `user` and `partner`.

**Effects:**
- The `notifyTypes` and `reportFrequency` of the existing partnership are updated to the new values.

**Request Body:**
```json
{
  "user": "string",
  "partner": "string",
  "notifyTypes": ["string"],
  "reportFrequency": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

### POST /api/Accountability/recordFailure

**Description:** Records a specific instance of an adherence failure for a user on a given date.

**Requirements:**
- The `date` string must be in a parsable format (e.g., YYYY-MM-DD).
- The exact same failure (user, date, type) must not already be recorded.

**Effects:**
- A new `AdherenceFailure` record is created for the user with the specified date and failure type.

**Request Body:**
```json
{
  "user": "string",
  "date": "string",
  "failureType": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

### POST /api/Accountability/reportAllFailuresFromStartToEnd

**Description:** Generates a summary string of all unreported adherence failures for a user within a specified date range.

**Requirements:**
- `startDate` and `endDate` must be valid, parsable date strings.
- `startDate` must be on or before `endDate`.

**Effects:**
- Finds all unreported adherence failures for the user between the start and end dates.
- Returns a string listing each failure, or a message indicating no failures were found.

**Request Body:**
```json
{
  "user": "string",
  "startDate": "string",
  "endDate": "string"
}
```

**Success Response Body (Action):**
```json
{
  "report": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

### POST /api/Accountability/updateReports

**Description:** Generates failure summaries per partnership based on reporting preferences, marks included failures as reported, updates lastReportDate, and appends each summary to the corresponding Reports document.

**Requirements:**
- The user must have at least one active partnership.
- The `date` string must be a valid, parsable date.

**Effects:**
- For each of the user's partnerships, checks if a report is due based on `reportFrequency` (Immediate/Daily/Weekly).
- Compiles relevant unreported failures into a summary string when due.
- Marks those failures as reported.
- Updates the partnership's `lastReportDate`.
- Appends the summary string to `Reports.allReports` for the document with `(user: partner, accountabilitySeeker: user)` (created if missing).

**Request Body:**
```json
{
  "user": "string",
  "date": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

### POST /api/Accountability/_getPartnerships

**Description:** Retrieves all partnerships associated with a user, where they are either the primary user or the partner.

**Requirements:**
- (None)

**Effects:**
- Returns an array of all `Partnership` objects where the specified user is either the `user` or the `partner`.

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "user": "string",
    "partner": "string",
    "notifyTypes": ["string"],
    "reportFrequency": "string",
    "lastReportDate": "string"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
# API Specification: CompetitionManager Concept

**Purpose:** manage multiple named sleep-adherence competitions between users, each tracking daily bedtime and wake-up performance over a defined time period and establishing a winner based off of scores.

---

## API Endpoints

### POST /api/CompetitionManager/startCompetition

**Description:** Creates a new named competition for a set of users with a defined start and end date.

**Requirements:**
- `name` must be a non-empty string.
- `participants` must contain at least two distinct user IDs.
- `startDateStr` and `endDateStr` must be valid date strings.
- The start date must be on or before the end date.

**Effects:**
- A new `Competition` is created with the given name, participants, and dates, marked as active.
- A `Score` record is created for each participant, initialized to zero.
- Returns the ID of the newly created competition.

**Request Body:**
```json
{
  "name": "string",
  "participants": ["string"],
  "startDateStr": "string",
  "endDateStr": "string"
}
```

**Success Response Body (Action):**
```json
{
  "competitionId": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

### POST /api/CompetitionManager/recordStat

**Description:** Records a sleep adherence event (success or failure) for a user, updating their score in all relevant active competitions.

**Requirements:**
- The user `u` must be a participant in at least one active competition.
- The `dateStr` must be a valid date string that falls within the active competition's date range.

**Effects:**
- The user's score is updated (+1 for success, 0 for failure) in every active competition they are part of where the event date falls within the competition's date range.
- The score for either `wakeUpScore` or `bedTimeScore` is adjusted based on the `eventType`.
- The date is added to `reportedBedtimeDates` or `reportedWakeUpDates` if it's not already in the array.

**Request Body:**
```json
{
  "u": "string",
  "dateStr": "string",
  "eventType": "string",
  "success": "boolean"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

### POST /api/CompetitionManager/endCompetition

**Description:** Ends an active competition, determines the winner(s), and marks the competition as inactive.

**Requirements:**
- The current date must be on or after the competition's `endDate`.
- The competition must be active.

**Effects:**
- The competition's `active` flag is set to `false`.
- The `winners` field is set to the user(s) with the highest total score.
- If all participants tie, `winners` is set to `null`.
- Returns the set of winning user IDs.

**Request Body:**
```json
{
  "competitionId": "string"
}
```

**Success Response Body (Action):**
```json
{
  "winners": ["string"]
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

### POST /api/CompetitionManager/\_getLeaderboard

**Description:** Retrieves a ranked leaderboard for a specific competition.

**Requirements:**
- `competitionId` must refer to an existing competition.

**Effects:**
- Retrieves all score entries for the competition.
- Calculates the total score for each user.
- Returns a ranked list of all participants in the competition, including their position, user ID, and total score.

**Request Body:**
```json
{
  "competitionId": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "position": "number",
    "userId": "string",
    "totalScore": "number"
  }
]
```

**Error Response Body:**
```json
[]
```
---

### POST /api/CompetitionManager/removeParticipant

**Description:** Removes a user from an active competition and deletes their score.

**Requirements:**
- `competitionId` must refer to an existing, active competition.
- `userId` must be a current member of the competition's participants.

**Effects:**
- The specified user is removed from the competition's `participants` list.
- The user's `Score` record for that competition is deleted.
- If the number of participants drops below two, the competition is deactivated.

**Request Body:**
```json
{
  "competitionId": "string",
  "userId": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
---
### POST /api/CompetitionManager/_getCompetitionsForUser

**Description:** Retrieves all competitions that a specific user is a participant in.

**Requirements:**
- A user with the given ID `u` must exist.

**Effects:**
- Returns a list of all `Competition` objects where the user is listed as a participant.

**Request Body:**
```json
{
  "u": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "name": "string",
    "participants": ["string"],
    "startDate": "string",
    "endDate": "string",
    "active": "boolean",
    "winners": ["string"]
  }
]
```

**Error Response Body:**
```json
[]
```


# API Specification: SleepSchedule Concept

**Purpose:** Let users set bedtime/wake goals, log sleep and wake events, and record daily adherence (did the user follow their targets).

---

## API Endpoints

### POST /api/SleepSchedule/addSleepSlot

**Description:** Creates a new daily sleep schedule (a "slot") for a user with target bedtime and wake-up times.

**Requirements:**
- `dateStr`, `bedTimeStr`, and `wakeTimeStr` must be valid, parsable date/time strings.
- `toleranceMins` must be a positive number.

**Effects:**
- If a `SleepSlot` already exists for the given user on the specified date, it is removed first.
- A new `SleepSlot` is created for the user on the given date with the specified time targets and tolerance.
- The adherence status (`wakeUpSuccess`, `bedTimeSuccess`) is initialized to null.

**Request Body:**
```json
{
  "u": "string",
  "bedTimeStr": "string",
  "wakeTimeStr": "string",
  "dateStr": "string",
  "toleranceMins": "number"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

### POST /api/SleepSchedule/removeSleepSlot

**Description:** Removes a user's sleep schedule for a specific date.

**Requirements:**
- `dateStr` must be a valid, parsable date string.
- A `SleepSlot` must exist for the user on the specified date.

**Effects:**
- The `SleepSlot` for the user on the given date is removed from the system.

**Request Body:**
```json
{
  "u": "string",
  "dateStr": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

### POST /api/SleepSchedule/reportBedTime

**Description:** Records the actual time a user went to bed and determines if they met their goal.

**Requirements:**
- `reportedTimeStr` and `dateStr` must be valid date/time strings.
- A `SleepSlot` must exist for the user on the specified date.

**Effects:**
- The `bedTimeSuccess` status is updated for the user's `SleepSlot` on the given date. Success is true if the absolute difference between the reported time and target bedtime is within the tolerance (toleranceMins) specified in the SleepSlot.
- Returns the boolean success status.

**Request Body:**
```json
{
  "u": "string",
  "reportedTimeStr": "string",
  "dateStr": "string"
}
```

**Success Response Body (Action):**
```json
{
  "bedTimeSuccess": "boolean"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

### POST /api/SleepSchedule/reportWakeUpTime

**Description:** Records the actual time a user woke up and determines if they met their goal.

**Requirements:**
- `reportedTimeStr` and `dateStr` must be valid date/time strings.
- A `SleepSlot` must exist for the user on the specified date.

**Effects:**
- The `wakeUpSuccess` status is updated for the user's `SleepSlot`. Success is true if the absolute difference between the reported time and target wake-up time is within the tolerance (toleranceMins) specified in the SleepSlot.
- Returns the boolean success status.

**Request Body:**
```json
{
  "u": "string",
  "reportedTimeStr": "string",
  "dateStr": "string"
}
```

**Success Response Body (Action):**
```json
{
  "wakeUpSuccess": "boolean"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

### POST /api/SleepSchedule/\_getSleepSlot

**Description:** Retrieves the sleep schedule for a user on a specific date.

**Requirements:**
- `dateStr` must be a valid date string.

**Effects:**
- Returns the `SleepSlot` object for the user and date if one exists.

**Request Body:**
```json
{
  "u": "string",
  "dateStr": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "u": "string",
    "date": "string",
    "bedTime": "string",
    "wakeUpTime": "string",
    "toleranceMins": "number",
    "wakeUpSuccess": "boolean",
    "bedTimeSuccess": "boolean"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

### POST /api/SleepSchedule/\_getAllSleepSlotsForUser

**Description:** Retrieves all sleep schedules for a given user.

**Requirements:**
- The user must exist.

**Effects:**
- Returns an array of all `SleepSlot` objects associated with the user.

**Request Body:**
```json
{
  "u": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "u": "string",
    "date": "string",
    "bedTime": "string",
    "wakeUpTime": "string",
    "toleranceMins": "number",
    "wakeUpSuccess": "boolean",
    "bedTimeSuccess": "boolean"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

# API Specification: SleepSchedule Concept

**Purpose:** Let users set bedtime/wake goals, log sleep and wake events, and record daily adherence (did the user follow their targets).

---

## API Endpoints

### POST /api/SleepSchedule/addSleepSlot

**Description:** Creates a new daily sleep schedule for a user with target bedtime and wake-up times.

**Requirements:**
- `dateStr`, `bedTimeStr`, and `wakeTimeStr` must be valid strings parseable into `Date` and `Time` objects respectively.
- `toleranceMins` must be a positive number.

**Effects:**
- Parses the date and time strings.
- If a `SleepSlot` already exists for the user `u` on the parsed `date`, removes it first.
- Creates a new `SleepSlot` for the user on the specified date with the target times and tolerance.
- Initializes `wakeUpSuccess` and `bedTimeSuccess` to `null`.

**Request Body:**
```json
{
  "u": "string",
  "bedTimeStr": "string",
  "wakeTimeStr": "string",
  "toleranceMins": "number",
  "dateStr": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/SleepSchedule/removeSleepSlot

**Description:** Removes a user's sleep schedule for a specific date.

**Requirements:**
- `dateStr` must be a valid date string parseable into a `Date`.
- A `SleepSlot` must exist for user `u` on the parsed `date`.

**Effects:**
- Parses `dateStr` into a `Date` object.
- Removes the `SleepSlot` for the user on that date.

**Request Body:**
```json
{
  "u": "string",
  "dateStr": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/SleepSchedule/reportBedTime

**Description:** Records a user's actual bedtime and evaluates whether they met their target.

**Requirements:**
- `reportedTimeStr` and `dateStr` must be valid strings parseable into `Time` and `Date` objects respectively.
- A `SleepSlot` with user `u` and the parsed `date` must exist.

**Effects:**
- Sets `bedTimeSuccess` for the `SleepSlot` based on whether the `reportedTime` is within the defined tolerance of the target `bedTime`.
- Returns the calculated `bedTimeSuccess` status.

**Request Body:**
```json
{
  "u": "string",
  "reportedTimeStr": "string",
  "dateStr": "string"
}
```

**Success Response Body (Action):**
```json
{
  "bedTimeSuccess": "boolean"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/SleepSchedule/reportWakeUpTime

**Description:** Records a user's actual wake-up time and evaluates whether they met their target.

**Requirements:**
- `reportedTimeStr` and `dateStr` must be valid strings parseable into `Time` and `Date` objects respectively.
- A `SleepSlot` with user `u` and the parsed `date` must exist.

**Effects:**
- Sets `wakeUpSuccess` for the `SleepSlot` based on whether the `reportedTime` is within the defined tolerance of the target `wakeUpTime`.
- Returns the calculated `wakeUpSuccess` status.

**Request Body:**
```json
{
  "u": "string",
  "reportedTimeStr": "string",
  "dateStr": "string"
}
```

**Success Response Body (Action):**
```json
{
  "wakeUpSuccess": "boolean"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/SleepSchedule/_getSleepSlot

**Description:** Retrieves the sleep schedule for a user on a specific date.

**Requirements:**
- `dateStr` must be a valid date string.

**Effects:**
- Returns the sleep slot for the given user and date, if it exists, including the tolerance setting.

**Request Body:**
```json
{
  "u": "string",
  "dateStr": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "u": "string",
    "date": "string",
    "bedTime": "string",
    "wakeUpTime": "string",
    "toleranceMins": "number",
    "wakeUpSuccess": "boolean",
    "bedTimeSuccess": "boolean"
  }
]
```

**Error Response Body:**
```json
[]
```
---
### POST /api/SleepSchedule/_getAllSleepSlotsForUser

**Description:** Retrieves all sleep schedules for a specific user.

**Requirements:**
- None

**Effects:**
- Returns an array of all sleep slots associated with the given user, including tolerance settings.

**Request Body:**
```json
{
  "u": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "u": "string",
    "date": "string",
    "bedTime": "string",
    "wakeUpTime": "string",
    "toleranceMins": "number",
    "wakeUpSuccess": "boolean",
    "bedTimeSuccess": "boolean"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---


# API Specification: PasswordAuth Concept

**Purpose:** limit access to known users and establish point of contact.

---

## API Endpoints

### POST /api/PasswordAuth/register

**Description:** Creates a new user account with a username and password.

**Requirements:**
- No User exists with the provided `username`.

**Effects:**
- Adds a new User with the given username and password to the system.
- Returns the unique ID of the new User.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**
```json
{
  "user": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/PasswordAuth/authenticate

**Description:** Authenticates a user with their username and password.

**Requirements:**
- A User must exist with the provided `username` and `password`.

**Effects:**
- Returns the corresponding user's unique ID.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**
```json
{
  "user": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/PasswordAuth/changePassword

**Description:** Changes a user's password after verifying their current password.

**Requirements:**
- A User must exist with the provided `username` and `currentPassword`.

**Effects:**
- The user's password is updated to `newPassword`.

**Request Body:**
```json
{
  "username": "string",
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/PasswordAuth/_isRegistered

**Description:** Checks if a username is already registered in the system.

**Requirements:**
- None.

**Effects:**
- Returns an array with a single object containing `isRegistered: true` if a User exists with the given username, otherwise `isRegistered: false`.

**Request Body:**
```json
{
  "username": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "isRegistered": "boolean"
  }
]
```

**Error Response Body:**
```json
[]
```
---
---

### POST /api/PasswordAuth/_getUsername

**Description:** Retrieves the username for a given user ID.

**Requirements:**
- A user with the given `userId` must exist.

**Effects:**
- Returns the `username` of the specified user.

**Request Body:**
```json
{
  "userId": "string"
}
```

**Success Response Body (Query):**
```json
[
{
  "username": "string"
}
]
```

**Error Response Body:**
```json
[]
```
---

### POST /api/PasswordAuth/deactivateAccount

**Description:** Deletes a user's account from the system.

**Requirements:**
- A User must exist with the provided `username` and `password`.

**Effects:**
- The User with the matching username and password is removed.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
