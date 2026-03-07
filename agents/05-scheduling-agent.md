# HireOn — Scheduling Agent

## Role
You are the **Automated Scheduling Agent** for HireOn. Your job is to implement the complete collision-proof interview scheduling engine — slot matching, conflict prevention, Google Calendar integration, Meet link generation, and email notifications.

---

## Project Context

**Goal:** Given a shortlisted candidate and available interviewers, find an overlapping free slot, book it atomically, generate a Google Meet link, and notify all parties.  
**Constraint:** Zero double-bookings. Enforced at both application layer AND database layer.  
**DB Constraints (already in schema):**
- `@@unique([interviewerId, startTime])` on Interviews
- `@@unique([candidateId, startTime])` on Interviews
- `isBooked` flag on `AvailabilitySlots`

---

## Files To Generate

```
src/
├── services/
│   ├── scheduling.service.ts
│   ├── calendar.service.ts
│   └── email.service.ts
├── controllers/
│   └── scheduling.controller.ts
├── routes/
│   └── scheduling.routes.ts
└── jobs/
    └── bulkScheduling.job.ts    (coordinate with AI Module Agent)
```

---

## Core Scheduling Algorithm

Implement `findOverlapSlot` — the heart of the engine:

```
INPUT:
  candidateId: string
  interviewerId: string
  durationMinutes: number (default: 60)

ALGORITHM:
1. Fetch all AvailabilitySlots where:
   - userId = candidateId AND isBooked = false AND startTime > now()
   
2. Fetch all AvailabilitySlots where:
   - userId = interviewerId AND isBooked = false AND startTime > now()
   
3. For each candidate slot:
   a. Check if slot duration >= durationMinutes
   b. Find interviewer slot where:
      - interviewer.startTime <= candidate.startTime
      - interviewer.endTime >= candidate.startTime + durationMinutes
   c. If match found → return { 
       startTime: candidate.startTime,
       endTime: candidate.startTime + durationMinutes,
       candidateSlotId,
       interviewerSlotId
     }
     
4. If no overlap → return null

OUTPUT: OverlapResult | null
```

---

## `src/services/scheduling.service.ts`

Implement these methods:

### `scheduleInterview(data: ScheduleInterviewDTO)`

```ts
interface ScheduleInterviewDTO {
  candidateId: string
  interviewerId: string
  requirementId: string
  hrId: string
  round?: number              // default 1
  durationMinutes?: number    // default 60
}
```

Full implementation:

```
1. Call findOverlapSlot(candidateId, interviewerId, durationMinutes)
2. If no slot found → throw NoAvailableSlotError

3. Open prisma.$transaction:
   a. Create Interview record:
      {
        candidateId,
        interviewerId,
        hrId,
        requirementId,
        startTime,
        endTime,
        status: 'SCHEDULED',
        round
      }
   b. Mark candidateSlot.isBooked = true
   c. Mark interviewerSlot.isBooked = true
   d. Update Candidate.status = 'SCHEDULED'
   
4. On transaction success:
   a. Call calendarService.createInterviewEvent(interview)
   b. Update Interview.meetLink with returned hangoutLink
   c. Update Interview.googleEventId
   d. Call emailService.sendInterviewConfirmation(interview)
   e. Write AuditLog: action: 'INTERVIEW_SCHEDULED'

5. Return populated interview object

Transaction must use:
  prisma.$transaction([...], { isolationLevel: 'Serializable' })
  
This prevents race conditions under concurrent scheduling.
```

---

### `cancelInterview(interviewId: string, cancelledById: string)`

```
1. Fetch Interview
2. Validate status !== 'COMPLETED'
3. prisma.$transaction:
   a. Update Interview.status = 'CANCELLED'
   b. Unbook: AvailabilitySlots.isBooked = false for both candidate + interviewer slots
4. Call calendarService.cancelEvent(interview.googleEventId)
5. Call emailService.sendCancellationNotice(interview)
6. Write AuditLog: action: 'INTERVIEW_CANCELLED'
```

---

### `rescheduleInterview(interviewId: string, dto: RescheduleDTO)`

```
1. Cancel existing interview (unbook slots, cancel Calendar event)
2. Call scheduleInterview with same parties, new availability
```

---

### `bulkScheduleForRequirement(requirementId: string, hrId: string)`

```
1. Fetch all SHORTLISTED candidates for the requirement
2. Fetch all active interviewers (role = INTERVIEWER)
3. For each candidate:
   a. Try each interviewer until an overlap is found
   b. If found: call scheduleInterview
   c. If none found: add to skipped list
4. Return { scheduled: Interview[], skipped: string[] (candidateIds) }
```

---

### `getAvailabilitySlots(userId: string)`

Returns all slots for a user, grouped by date, with `isBooked` status.

---

### `addAvailabilitySlots(userId: string, slots: SlotInput[])`

```ts
interface SlotInput {
  startTime: string  // ISO datetime
  endTime: string    // ISO datetime
}
```

Validate:
- `endTime > startTime`
- Duration between 30 min and 4 hours
- No overlapping slots for the same user
- No slots in the past

Bulk insert with `prisma.createMany`.

---

### `deleteAvailabilitySlot(slotId: string, userId: string)`

- Validate slot belongs to user
- Validate `isBooked === false`
- Delete slot

---

## `src/services/calendar.service.ts`

### Setup

Use Google Calendar API with a **Service Account** (recommended for MVP — no user OAuth needed):

```ts
import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/calendar'],
})

const calendar = google.calendar({ version: 'v3', auth })
```

---

### `createInterviewEvent(interview: InterviewWithRelations)`

```ts
const event = {
  summary: `HireOn Interview — ${candidate.name} × ${requirement.title}`,
  description: `
    Candidate: ${candidate.name}
    Role: ${requirement.title}
    Round: ${interview.round}
    Scheduled by HireOn AI Scheduling Engine
  `,
  start: { dateTime: interview.startTime.toISOString(), timeZone: 'UTC' },
  end: { dateTime: interview.endTime.toISOString(), timeZone: 'UTC' },
  attendees: [
    { email: candidate.email },
    { email: interviewer.email },
    { email: hr.email }
  ],
  conferenceData: {
    createRequest: {
      requestId: interview.id,
      conferenceSolutionKey: { type: 'hangoutsMeet' }
    }
  },
  reminders: {
    useDefault: false,
    overrides: [
      { method: 'email', minutes: 60 },
      { method: 'popup', minutes: 15 }
    ]
  }
}

const response = await calendar.events.insert({
  calendarId: 'primary',
  resource: event,
  conferenceDataVersion: 1,
  sendUpdates: 'all'     // sends Google Calendar invites to attendees
})

return {
  eventId: response.data.id,
  meetLink: response.data.hangoutLink
}
```

---

### `cancelEvent(googleEventId: string)`

```ts
await calendar.events.patch({
  calendarId: 'primary',
  eventId: googleEventId,
  resource: { status: 'cancelled' },
  sendUpdates: 'all'
})
```

---

## `src/services/email.service.ts`

Use **Resend** for transactional email.

### Setup
```ts
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)
```

### `sendInterviewConfirmation(interview: InterviewWithRelations)`

Send 3 emails:

**To Candidate:**
```
Subject: Your interview is confirmed — {{requirement.title}} at {{company}}
Body:
  Hi {{candidate.name}},
  Your interview has been scheduled.
  
  Role: {{requirement.title}}
  Date: {{formatDate(interview.startTime)}}
  Time: {{formatTime(interview.startTime)}} UTC
  Duration: 60 minutes
  Google Meet: {{interview.meetLink}}
  
  Good luck! — HireOn
```

**To Interviewer:**
```
Subject: Interview scheduled — {{candidate.name}} for {{requirement.title}}
Body:
  Hi {{interviewer.name}},
  You have an interview scheduled.
  
  Candidate: {{candidate.name}}
  Role: {{requirement.title}}
  Date: {{formatDate(interview.startTime)}}
  Meet Link: {{interview.meetLink}}
  
  AI Match Score: {{aiProfile.matchScore}}%
  AI Summary: [link to HR panel]
```

**To HR:**
```
Subject: Interview booked — {{candidate.name}} × {{interviewer.name}}
Body:
  Interview successfully scheduled by HireOn.
  [Summary of details]
```

### `sendCancellationNotice(interview: InterviewWithRelations)`

Notify all three parties of cancellation.

---

## `src/controllers/scheduling.controller.ts`

```
POST   /api/scheduling/schedule          HR only — schedule single interview
POST   /api/scheduling/bulk              HR only — bulk schedule for requirement
POST   /api/scheduling/cancel/:id        HR only — cancel interview
POST   /api/scheduling/reschedule/:id    HR only — reschedule interview

GET    /api/availability/:userId         Auth required — get slots
POST   /api/availability                 Auth required — add slots
DELETE /api/availability/:slotId         Auth required — delete slot
```

---

## Error Handling

Define these error types:

```ts
class NoAvailableSlotError extends Error {
  constructor(candidateId: string, interviewerId: string) {
    super(`No overlapping availability between candidate ${candidateId} and interviewer ${interviewerId}`)
  }
}

class SlotAlreadyBookedError extends Error {}
class InterviewAlreadyScheduledError extends Error {}
class InvalidSlotDurationError extends Error {}
class PastSlotError extends Error {}
class GoogleCalendarError extends Error {}
```

---

## Environment Variables Required

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=hireon@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_CALENDAR_ID=primary
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@hireon.com
COMPANY_NAME=HireOn
```

---

## Output Checklist

- [ ] `findOverlapSlot` algorithm correctly handles edge cases (partial overlaps, duration checks)
- [ ] `scheduleInterview` uses `Serializable` transaction isolation
- [ ] Slots marked as `isBooked = true` atomically with interview creation
- [ ] Google Calendar event created with Meet link via `conferenceDataVersion: 1`
- [ ] All 3 parties notified by email
- [ ] Cancellation properly unbooks slots AND cancels Google event
- [ ] Bulk scheduling skips gracefully when no slot found
- [ ] `addAvailabilitySlots` validates no overlaps for same user
- [ ] Rate limiting: max 5 schedule operations per minute per HR user
