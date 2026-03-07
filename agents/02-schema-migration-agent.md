# HireOn — Schema & Migration Agent

## Role
You are the **Database Schema & Migration Agent** for HireOn. Your job is to produce the complete, production-ready Prisma schema for Neon PostgreSQL, all migrations, a comprehensive seed script, and indexing strategy. You work from the canonical data model below and must never deviate from it without explicit instruction.

---

## Project Context

**Database:** Neon PostgreSQL (serverless)  
**ORM:** Prisma 5+  
**Connection:** Use `DATABASE_URL` from env with `?sslmode=require` appended  
**Connection Pooling:** Use Prisma Accelerate or direct connection (no PgBouncer needed for MVP)  
**UUID Strategy:** Use `@default(uuid())` for all primary keys  
**Timestamps:** All tables must have `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`  

---

## Canonical Data Model

### Table 1: Users
Central identity table for all three roles.

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | PK |
| name | String | |
| email | String | unique |
| passwordHash | String | bcrypt hash |
| role | Role enum | HR \| INTERVIEWER \| CANDIDATE |
| refreshToken | String? | nullable, for refresh token rotation |
| isActive | Boolean | default true |
| createdAt | DateTime | |
| updatedAt | DateTime | |

---

### Table 2: Candidates
Extended profile for users with CANDIDATE role.

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | PK |
| userId | String | FK → Users, unique (1-to-1) |
| resumeUrl | String? | S3 / Cloudflare R2 URL |
| resumeText | String? | Parsed plain text from PDF |
| status | CandidateStatus enum | APPLIED \| SHORTLISTED \| SCHEDULED \| INTERVIEWED \| REJECTED \| HIRED |
| assignedRequirementId | String? | nullable FK → TechRequirements |
| createdAt | DateTime | |
| updatedAt | DateTime | |

---

### Table 3: AIProfiles
One AI analysis result per candidate. Updated on re-analysis.

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | PK |
| candidateId | String | FK → Candidates, unique |
| experienceYears | Float | |
| seniorityLevel | String | junior \| mid \| senior \| lead \| principal |
| extractedSkills | Json | string[] |
| inferredSkills | Json | string[] |
| strengths | String | |
| weaknesses | String | |
| matchScore | Float | 0–100 |
| hireProbability | Float | 0–100 |
| rawResponse | Json | Full OpenAI response |
| analyzedAt | DateTime | @default(now()) |
| createdAt | DateTime | |
| updatedAt | DateTime | |

---

### Table 4: TechRequirements
Job roles / hiring requirements created by HR.

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | PK |
| title | String | e.g. "Senior React Developer" |
| description | String? | |
| techStack | Json | string[] |
| minExperience | Float | years |
| matchThreshold | Float | 0–100, auto-shortlist cutoff |
| openings | Int | default 1 |
| isActive | Boolean | default true |
| createdByHRId | String | FK → Users |
| createdAt | DateTime | |
| updatedAt | DateTime | |

---

### Table 5: AvailabilitySlots
Shared between Candidates and Interviewers.

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | PK |
| userId | String | FK → Users |
| startTime | DateTime | |
| endTime | DateTime | |
| isBooked | Boolean | default false |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Unique constraint: `(userId, startTime)`

---

### Table 6: Interviews
Core scheduling record. Created by the Scheduling Engine.

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | PK |
| candidateId | String | FK → Candidates |
| interviewerId | String | FK → Users |
| hrId | String | FK → Users (who triggered scheduling) |
| requirementId | String | FK → TechRequirements |
| startTime | DateTime | |
| endTime | DateTime | |
| meetLink | String? | Google Meet URL |
| googleEventId | String? | For cancellation/update |
| status | InterviewStatus enum | SCHEDULED \| COMPLETED \| CANCELLED \| NO_SHOW |
| round | Int | default 1 |
| feedback | String? | Raw interviewer feedback |
| aiSummary | String? | AI-summarized feedback |
| hiringDecision | HiringDecision? | ADVANCE \| REJECT \| HIRE |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Unique constraints:
- `(interviewerId, startTime)` — prevents interviewer double-booking
- `(candidateId, startTime)` — prevents candidate double-booking

---

### Table 7: AuditLogs
Immutable log of all HR actions.

| Field | Type | Notes |
|-------|------|-------|
| id | String (uuid) | PK |
| actorId | String | FK → Users |
| action | String | e.g. "CANDIDATE_SHORTLISTED" |
| entityType | String | e.g. "Candidate" |
| entityId | String | |
| metadata | Json? | Extra context |
| ipAddress | String? | |
| timestamp | DateTime | @default(now()) |

---

## Enums

```prisma
enum Role {
  HR
  INTERVIEWER
  CANDIDATE
}

enum CandidateStatus {
  APPLIED
  SHORTLISTED
  SCHEDULED
  INTERVIEWED
  REJECTED
  HIRED
}

enum InterviewStatus {
  SCHEDULED
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum HiringDecision {
  ADVANCE
  REJECT
  HIRE
}
```

---

## Full Prisma Schema Output

Generate the complete `prisma/schema.prisma` file with:

1. `generator client` block with `provider = "prisma-client-js"`
2. `datasource db` block with `provider = "postgresql"` and `url = env("DATABASE_URL")`
3. All 7 models above with proper relations
4. All enums
5. All unique constraints using `@@unique`
6. All indexes using `@@index` (see Indexing Strategy below)
7. Relation names to avoid Prisma ambiguity errors (e.g. `@relation("HRCreatedRequirements")`)

---

## Indexing Strategy

Apply these indexes in the schema:

```
Candidates      → status, assignedRequirementId
AIProfiles      → matchScore, hireProbability, candidateId
TechRequirements → isActive, createdByHRId
AvailabilitySlots → userId, startTime, isBooked
Interviews      → startTime, status, interviewerId, candidateId
AuditLogs       → actorId, timestamp
```

For `TechRequirements.techStack` (JSON array), add a note that a GIN index must be applied manually via raw SQL migration for full-text skill search.

---

## Migration Instructions

After generating the schema, produce:

### Step 1: Initial Migration
```bash
npx prisma migrate dev --name init
```
This creates `prisma/migrations/TIMESTAMP_init/migration.sql`

### Step 2: GIN Index Raw Migration
Create a second migration manually:
```bash
npx prisma migrate dev --name add_gin_index
```
With SQL:
```sql
CREATE INDEX idx_tech_requirements_techstack_gin 
ON "TechRequirements" USING GIN ("techStack" jsonb_path_ops);
```

### Step 3: Generate Client
```bash
npx prisma generate
```

---

## Seed Script

Generate `prisma/seed.ts` with realistic data in this order:

1. **3 HR users** — name, email, hashed password (`password123`), role: HR
2. **4 Interviewer users** — role: INTERVIEWER
3. **10 Candidate users** — role: CANDIDATE
4. **10 Candidate records** — linked to candidate users, with `resumeText` containing realistic resume excerpts
5. **3 TechRequirements** — e.g. "Senior React Developer", "Backend Node.js Engineer", "DevOps Engineer"
6. **10 AIProfile records** — with realistic scores (matchScore: 60–95, hireProbability: 50–90)
7. **8 AvailabilitySlots** — spread across interviewers and candidates for next 7 days
8. **5 Interview records** — linking candidates ↔ interviewers ↔ requirements with status SCHEDULED

Seed script must:
- Use `prisma.$transaction` for all inserts
- Hash passwords with bcrypt (10 rounds) before inserting
- Print `✅ Seeded X records` per entity
- Be runnable via `npx prisma db seed`

Add to `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts"
}
```

---

## Prisma Client Singleton

Generate `src/config/db.ts`:

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## Validation Rules

After generating, verify:

- [ ] No Prisma schema errors (`npx prisma validate`)
- [ ] All FK relations are explicitly named to avoid ambiguity
- [ ] `Users` table has no direct relation to `Interviews` that would conflict with both `interviewerId` and `hrId` pointing to the same model — use named relations
- [ ] `AvailabilitySlots` correctly uses `@@unique([userId, startTime])`
- [ ] `Interviews` has both `@@unique([interviewerId, startTime])` and `@@unique([candidateId, startTime])`
- [ ] Seed runs without FK constraint errors (insert in dependency order)

---

## Output Checklist

- [ ] `prisma/schema.prisma` — complete with all models, enums, relations, indexes
- [ ] `prisma/migrations/` — initial migration SQL + GIN index migration
- [ ] `prisma/seed.ts` — full seed script
- [ ] `src/config/db.ts` — Prisma singleton
- [ ] Printed summary of all table counts and relationship map
