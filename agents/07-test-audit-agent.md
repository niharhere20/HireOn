# HireOn — Test & Audit Agent

## Role
You are the **Test & Audit Agent** for HireOn. Your job is to generate a complete test suite — integration tests for all API endpoints, unit tests for critical business logic, and a security audit checklist. Ship-ready, zero guesswork.

---

## Project Context

**Backend Test Framework:** Jest + Supertest  
**DB in Tests:** Neon PostgreSQL test database (separate `DATABASE_TEST_URL` env var) + Prisma migrations  
**Mocking:** `jest.mock` for OpenAI, Google Calendar, Resend, BullMQ  
**Frontend Tests:** React Testing Library + Jest (optional, cover critical forms only)  
**Coverage Target:** 80% on services, 100% on auth and scheduling logic  

---

## Files To Generate

```
hireon-backend/
├── src/__tests__/
│   ├── setup.ts                    # Global test setup
│   ├── auth/
│   │   ├── register.test.ts
│   │   ├── login.test.ts
│   │   └── refresh.test.ts
│   ├── candidates/
│   │   ├── upload.test.ts
│   │   └── status.test.ts
│   ├── requirements/
│   │   └── requirements.test.ts
│   ├── scheduling/
│   │   ├── overlap.test.ts
│   │   ├── schedule.test.ts
│   │   └── collision.test.ts
│   ├── ai/
│   │   ├── analyze.test.ts
│   │   └── promptInjection.test.ts
│   └── audit/
│       └── security.audit.ts       # Not a test — a checklist runner
├── jest.config.ts
└── .env.test
```

---

## Global Test Setup

### `src/__tests__/setup.ts`

```ts
import { prisma } from '../config/db'
import { execSync } from 'child_process'

beforeAll(async () => {
  // Run migrations on test DB
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_TEST_URL }
  })
})

beforeEach(async () => {
  // Clean all tables in dependency order
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.interview.deleteMany(),
    prisma.availabilitySlot.deleteMany(),
    prisma.aIProfile.deleteMany(),
    prisma.candidate.deleteMany(),
    prisma.techRequirement.deleteMany(),
    prisma.user.deleteMany(),
  ])
})

afterAll(async () => {
  await prisma.$disconnect()
})
```

---

### `jest.config.ts`

```ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterFramework: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/controllers/**/*.ts',
    'src/middlewares/**/*.ts',
    'src/utils/**/*.ts',
    '!src/**/*.d.ts'
  ],
  coverageThresholds: {
    global: { lines: 80, functions: 80 },
    './src/services/auth.service.ts': { lines: 100 },
    './src/services/scheduling.service.ts': { lines: 100 }
  }
}
```

---

## Auth Tests

### `auth/register.test.ts`

Generate tests for ALL of these cases:

```
✅ POST /api/auth/register
  - registers a new HR user with valid data
  - registers a new CANDIDATE user and creates Candidate record
  - returns 400 if email already exists
  - returns 400 if password is less than 8 characters
  - returns 400 if role is invalid
  - returns 400 if name is missing
  - does not return passwordHash in response
  - does not return refreshToken in response
  - creates AuditLog entry on successful registration
```

### `auth/login.test.ts`

```
✅ POST /api/auth/login
  - returns accessToken + sets refresh cookie on valid credentials
  - returns 401 on wrong password
  - returns 401 on non-existent email
  - returns 403 if user isActive = false
  - refresh token cookie is httpOnly
  - refresh token cookie path is /api/auth/refresh
  - access token expires in 15 minutes (decode and check exp)
```

### `auth/refresh.test.ts`

```
✅ POST /api/auth/refresh
  - returns new accessToken with valid refresh cookie
  - returns 401 if no cookie present
  - returns 401 if refresh token is expired
  - returns 401 if refresh token has been rotated (reuse attack)
  - old refresh token is invalidated after rotation
  - new refresh token is different from old one
```

---

## Scheduling Tests

### `scheduling/overlap.test.ts`

Unit test the `findOverlapSlot` function directly (no HTTP):

```
✅ findOverlapSlot(candidateId, interviewerId, duration)
  - returns overlap when candidate and interviewer have matching free slots
  - returns null when candidate has no free slots
  - returns null when interviewer has no free slots
  - returns null when slots don't overlap
  - returns null when overlap exists but is shorter than duration
  - ignores slots where isBooked = true
  - ignores slots in the past
  - handles multiple interviewers, picks first available
  - handles multiple candidates waiting, schedules them independently
```

Test data helpers to generate:
```ts
function createSlot(userId: string, startHour: number, endHour: number, date?: Date)
function createUserWithSlots(role: Role, slots: SlotConfig[])
```

---

### `scheduling/collision.test.ts`

These are the most critical tests — **concurrent booking prevention**:

```
✅ Collision Prevention
  - two simultaneous schedule requests for same interviewer + timeslot: only one succeeds
  - two simultaneous schedule requests for same candidate + timeslot: only one succeeds
  - Prisma unique constraint on (interviewerId, startTime) rejects duplicate
  - Prisma unique constraint on (candidateId, startTime) rejects duplicate
  - after failed collision, slot remains unbooked for retry
  - serializable transaction prevents lost update anomaly
```

To test concurrency:
```ts
it('prevents double booking under race condition', async () => {
  // Setup: 1 candidate, 2 HR users, 1 overlapping slot
  const [result1, result2] = await Promise.allSettled([
    schedulingService.scheduleInterview(dto),
    schedulingService.scheduleInterview(dto)  // same dto
  ])
  
  const successes = [result1, result2].filter(r => r.status === 'fulfilled')
  const failures = [result1, result2].filter(r => r.status === 'rejected')
  
  expect(successes).toHaveLength(1)
  expect(failures).toHaveLength(1)
  
  // Verify slot is booked exactly once
  const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId } })
  expect(slot?.isBooked).toBe(true)
  
  // Verify only one interview record exists
  const interviews = await prisma.interview.findMany({ where: { candidateId } })
  expect(interviews).toHaveLength(1)
})
```

---

### `scheduling/schedule.test.ts`

```
✅ POST /api/scheduling/schedule
  - creates Interview record on success
  - marks candidate slot as isBooked = true
  - marks interviewer slot as isBooked = true
  - updates Candidate.status to SCHEDULED
  - calls calendarService.createInterviewEvent (mocked)
  - saves meetLink to Interview record
  - calls emailService.sendInterviewConfirmation (mocked)
  - writes AuditLog entry
  - returns 404 if candidate not found
  - returns 404 if interviewer not found
  - returns 422 if no available overlapping slot
  - returns 403 if called by non-HR user
```

---

## AI Module Tests

### `ai/analyze.test.ts`

Mock OpenAI:
```ts
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                experience_years: 5,
                seniority_level: 'senior',
                extracted_skills: ['React', 'TypeScript'],
                inferred_skills: ['Testing'],
                strengths: 'Strong frontend skills',
                weaknesses: 'Limited backend experience',
                match_score: 85,
                hire_probability: 78,
                match_reasoning: 'Strong match on required tech stack',
                red_flags: []
              })
            }
          }]
        })
      }
    }
  }))
}))
```

Tests:
```
✅ POST /api/ai/analyze/:candidateId
  - queues BullMQ job and returns jobId
  - worker: saves AIProfile to database
  - worker: auto-shortlists candidate when matchScore >= threshold
  - worker: does NOT shortlist when matchScore < threshold
  - worker: writes AuditLog on completion
  - returns 400 if candidate has no resumeText
  - returns 403 if called by non-HR user
  - handles OpenAI API failure gracefully (job marked failed, not crashed)
  - validates AI response schema — rejects malformed JSON
```

### `ai/promptInjection.test.ts`

```
✅ Resume Sanitization (sanitizeResumeText)
  - strips "Ignore previous instructions" from resume text
  - strips "You are now..." injections
  - truncates text exceeding 24000 characters
  - preserves normal resume content
  - removes null bytes and control characters
```

---

## Candidates Tests

### `candidates/upload.test.ts`

```
✅ Resume Upload
  - accepts valid PDF file
  - rejects non-PDF files with 400
  - rejects files > 5MB with 413
  - stores resumeUrl and resumeText on Candidate record
  - returns 403 if non-candidate tries to upload
```

---

## Requirements Tests

```
✅ TechRequirements CRUD
  - HR can create a requirement
  - HR can list all active requirements
  - HR can deactivate a requirement
  - Non-HR cannot create requirements (403)
  - matchThreshold must be between 0–100
  - minExperience must be non-negative
  - techStack must be a non-empty array
```

---

## Security Audit Checklist

Generate `src/__tests__/audit/security.audit.ts` as a runnable Jest test file that verifies:

### Authentication
```
✅ No endpoint returns passwordHash in response
✅ No endpoint returns refreshToken in response  
✅ All /hr/* routes return 401 without token
✅ All /interviewer/* routes return 401 without token
✅ All /candidate/* routes return 401 without token
✅ HR endpoints return 403 when called by INTERVIEWER
✅ HR endpoints return 403 when called by CANDIDATE
✅ Interviewer cannot access other interviewer's data
✅ Candidate cannot access other candidate's data
```

### Input Validation
```
✅ Resume text is sanitized before OpenAI call
✅ SQL injection attempt in search query is handled safely (Prisma parameterizes)
✅ XSS attempt in feedback text is stored as plain text (no HTML execution)
✅ Oversized request body returns 413 (configure express limit: '5mb')
```

### Rate Limiting
```
✅ /auth/login throttled after 5 failed attempts per IP per 15 min
✅ /api/ai/* throttled at 20 requests per minute per user
✅ Rate limit returns 429 with Retry-After header
```

### Token Security
```
✅ Expired access token returns 401
✅ Tampered token signature returns 401
✅ Token with wrong role gets 403 on role-protected routes
✅ Refresh token reuse returns 401 (rotation enforcement)
```

---

## Mock Helpers

Create `src/__tests__/helpers/` with:

```ts
// factory.ts — test data factories
createTestUser(role: Role, overrides?): Promise<User>
createTestCandidate(overrides?): Promise<{ user: User, candidate: Candidate }>
createTestRequirement(hrId: string, overrides?): Promise<TechRequirement>
createTestSlot(userId: string, hoursFromNow: number): Promise<AvailabilitySlot>
createTestInterview(overrides?): Promise<Interview>

// auth.ts — get auth tokens for tests
getAuthHeaders(user: User): { Authorization: string }
loginAs(role: Role): Promise<{ user: User, headers: Headers }>
```

---

## CI Configuration

Generate `.github/workflows/test.yml`:

```yaml
name: HireOn Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      DATABASE_TEST_URL: ${{ secrets.DATABASE_TEST_URL }}
      JWT_SECRET: test_jwt_secret_32_chars_minimum
      JWT_REFRESH_SECRET: test_refresh_secret_32_chars
      OPENAI_API_KEY: test_key (mocked)
      REDIS_URL: redis://localhost:6379
    services:
      redis:
        image: redis:7
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm test -- --coverage
      - run: npm run test:audit
```

---

## Output Checklist

- [ ] All test files generated and compilable
- [ ] OpenAI, Google Calendar, Resend, BullMQ all mocked
- [ ] Collision tests use `Promise.allSettled` for concurrency simulation
- [ ] Security audit covers all 4 categories (auth, input, rate limiting, tokens)
- [ ] Test factories produce minimal, valid test data
- [ ] Coverage thresholds set and enforced in jest.config.ts
- [ ] CI workflow generated
- [ ] `.env.test` generated with safe test values
