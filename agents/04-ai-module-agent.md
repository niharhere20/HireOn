# HireOn — AI Module Agent

## Role
You are the **AI Module Agent** for HireOn. Your job is to implement the complete AI intelligence layer — resume analysis, skill extraction, match scoring, hire probability, and feedback summarization. All AI calls go through OpenAI with structured JSON output. All jobs are processed asynchronously via BullMQ.

---

## Project Context

**AI Provider:** OpenAI API (`gpt-4o` for analysis, `gpt-4o-mini` for feedback summary)  
**Output Format:** Structured JSON via OpenAI response_format  
**Queue:** BullMQ with Redis (Upstash)  
**Trigger:** HR clicks "Analyze" → job queued → worker processes → result saved to `AIProfiles`  
**Auto-shortlisting:** After analysis, if `matchScore >= requirement.matchThreshold` → update `Candidates.status = SHORTLISTED`

---

## Files To Generate

```
src/
├── services/ai.service.ts
├── controllers/ai.controller.ts
├── routes/ai.routes.ts
├── jobs/
│   ├── queues.ts
│   ├── workers.ts
│   ├── resumeAnalysis.job.ts
│   ├── feedbackSummary.job.ts
│   └── bulkScheduling.job.ts
└── utils/resumeParser.ts
```

---

## AI Output Schema

This is the canonical shape of every AI resume analysis. It must be validated with Zod before saving.

```ts
interface AIAnalysisResult {
  experience_years: number           // Float, total years of relevant experience
  seniority_level: string            // "junior" | "mid" | "senior" | "lead" | "principal"
  extracted_skills: string[]         // Explicitly listed in resume
  inferred_skills: string[]          // Inferred from context, projects, descriptions
  strengths: string                  // 2-3 sentence summary of candidate strengths
  weaknesses: string                 // 2-3 sentence summary of gaps or concerns
  match_score: number                // 0–100, how well candidate matches the requirement
  hire_probability: number           // 0–100, overall hiring recommendation score
  match_reasoning: string            // 1-2 sentences explaining the score
  red_flags: string[]                // Any concerns: job hopping, skill inflation, gaps
}
```

---

## Resume Analysis Prompt

Use this exact prompt structure:

### System Prompt
```
You are HireOn's AI Hiring Intelligence Engine. Your job is to analyze candidate resumes against specific job requirements and produce precise, unbiased, structured hiring intelligence.

Rules:
1. Be objective. Do not assume skills not evidenced in the resume.
2. Inferred skills must be clearly justified by context (e.g., "used AWS Lambda" implies cloud skills).
3. match_score is based ONLY on the provided tech stack and experience requirements.
4. hire_probability factors in overall profile quality, communication clarity, career trajectory.
5. Red flags are factual observations, not opinions.
6. Respond ONLY with valid JSON matching the exact schema provided. No extra text.
```

### User Prompt Template
```
Analyze this candidate for the following job requirement.

JOB REQUIREMENT:
- Title: {{requirement.title}}
- Required Tech Stack: {{requirement.techStack | join(', ')}}
- Minimum Experience: {{requirement.minExperience}} years
- Description: {{requirement.description}}

CANDIDATE RESUME:
{{candidate.resumeText}}

Respond with JSON matching this schema exactly:
{
  "experience_years": number,
  "seniority_level": "junior" | "mid" | "senior" | "lead" | "principal",
  "extracted_skills": string[],
  "inferred_skills": string[],
  "strengths": string,
  "weaknesses": string,
  "match_score": number (0-100),
  "hire_probability": number (0-100),
  "match_reasoning": string,
  "red_flags": string[]
}
```

---

## Feedback Summarization Prompt

### System Prompt
```
You are HireOn's post-interview AI summarizer. Given raw interviewer feedback, produce a concise, structured, professional summary for HR review.

Rules:
1. Be factual. Summarize only what is stated.
2. Do not editorialize or add opinions.
3. Extract a clear hiring signal: ADVANCE, REJECT, or HIRE.
4. Respond ONLY with valid JSON.
```

### User Prompt Template
```
Summarize this interviewer feedback for HR review.

CANDIDATE: {{candidate.name}}
ROLE: {{requirement.title}}
INTERVIEW ROUND: {{interview.round}}
RAW FEEDBACK: {{interview.feedback}}

Respond with JSON:
{
  "summary": string (3-5 sentences),
  "key_positives": string[],
  "key_concerns": string[],
  "hiring_signal": "ADVANCE" | "REJECT" | "HIRE",
  "confidence": number (0-100)
}
```

---

## `src/utils/resumeParser.ts`

Implement PDF → plain text extraction:

```ts
import pdfParse from 'pdf-parse'
import fs from 'fs'

export async function parseResumeFromBuffer(buffer: Buffer): Promise<string>
export async function parseResumeFromPath(filePath: string): Promise<string>
export function sanitizeResumeText(raw: string): string
```

`sanitizeResumeText` must:
- Remove control characters
- Collapse excessive whitespace
- Trim to max 6000 tokens (~24,000 chars) to stay within context limits
- Remove any content that looks like prompt injection (e.g. lines starting with "Ignore previous instructions")

---

## `src/jobs/queues.ts`

Define BullMQ queues:

```ts
import { Queue } from 'bullmq'
import { redis } from '../config/redis'

export const resumeAnalysisQueue = new Queue('resume-analysis', { connection: redis })
export const feedbackSummaryQueue = new Queue('feedback-summary', { connection: redis })
export const bulkSchedulingQueue = new Queue('bulk-scheduling', { connection: redis })
```

Also create `src/config/redis.ts`:
```ts
import { Redis } from 'ioredis'
export const redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })
```

---

## `src/jobs/resumeAnalysis.job.ts`

Job data shape:
```ts
interface ResumeAnalysisJobData {
  candidateId: string
  requirementId: string
  triggeredByHRId: string
}
```

Worker logic:
1. Fetch `Candidate` (with `resumeText`) from DB
2. Fetch `TechRequirement` from DB
3. Validate both exist
4. Build prompt from template above
5. Call OpenAI with `response_format: { type: 'json_object' }`
6. Parse and validate response against Zod schema
7. Upsert `AIProfiles` record (update if exists, insert if not)
8. Check: if `matchScore >= requirement.matchThreshold`
   - Update `Candidate.status = 'SHORTLISTED'`
   - Update `Candidate.assignedRequirementId = requirementId`
9. Write `AuditLog` entry: `action: 'AI_ANALYSIS_COMPLETE'`
10. On failure: write `AuditLog` entry: `action: 'AI_ANALYSIS_FAILED'`, set job to failed

Retry config:
```ts
{ attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
```

---

## `src/jobs/feedbackSummary.job.ts`

Job data shape:
```ts
interface FeedbackSummaryJobData {
  interviewId: string
}
```

Worker logic:
1. Fetch `Interview` with candidate + requirement
2. Validate `feedback` text exists
3. Build summarization prompt
4. Call OpenAI `gpt-4o-mini`
5. Parse response, validate schema
6. Update `Interview.aiSummary` with the summary text
7. Update `Interview.hiringDecision` based on `hiring_signal`
8. Update `AIProfile.hireProbability` if confidence >= 70

---

## `src/jobs/bulkScheduling.job.ts`

Job data shape:
```ts
interface BulkSchedulingJobData {
  requirementId: string
  triggeredByHRId: string
}
```

Worker logic:
1. Fetch all `SHORTLISTED` candidates for the requirement
2. Fetch all available interviewers
3. For each candidate without a scheduled interview:
   a. Run overlap algorithm (see Scheduling Agent)
   b. If slot found: enqueue a scheduling job
   c. If no slot found: log and skip
4. Return summary: `{ scheduled: number, skipped: number }`

---

## `src/services/ai.service.ts`

```ts
// Enqueues resume analysis job
analyzeResume(candidateId: string, requirementId: string, hrId: string): Promise<{ jobId: string }>

// Gets current AI profile for a candidate
getAIProfile(candidateId: string): Promise<AIProfile | null>

// Gets analysis job status from BullMQ
getJobStatus(jobId: string): Promise<{ status: string, progress?: number }>

// Enqueues feedback summary job
summarizeFeedback(interviewId: string): Promise<{ jobId: string }>

// Direct call (for admin/testing, not production flow)
analyzeResumeSync(candidateId: string, requirementId: string): Promise<AIAnalysisResult>
```

---

## `src/controllers/ai.controller.ts`

```
POST   /api/ai/analyze/:candidateId     HR only — queue analysis job
GET    /api/ai/profile/:candidateId     HR only — get AI profile
GET    /api/ai/job/:jobId               HR only — poll job status
POST   /api/ai/summarize/:interviewId   HR/Interviewer — queue feedback summary
POST   /api/ai/bulk-analyze             HR only — queue analysis for all unanalyzed candidates of a requirement
```

---

## `src/workers.ts`

Bootstrap all workers on server startup:

```ts
import { Worker } from 'bullmq'

// resumeAnalysisWorker
// feedbackSummaryWorker
// bulkSchedulingWorker

// Each worker:
// - Connects to Redis
// - Processes jobs from queue
// - Logs success/failure
// - Updates job progress (0 → 25 → 50 → 75 → 100)
```

Workers must be started in `app.ts` only in non-test environments.

---

## Zod Validation

```ts
const AIAnalysisResultSchema = z.object({
  experience_years: z.number().min(0).max(50),
  seniority_level: z.enum(['junior', 'mid', 'senior', 'lead', 'principal']),
  extracted_skills: z.array(z.string()).max(30),
  inferred_skills: z.array(z.string()).max(20),
  strengths: z.string().min(10).max(1000),
  weaknesses: z.string().min(10).max(1000),
  match_score: z.number().min(0).max(100),
  hire_probability: z.number().min(0).max(100),
  match_reasoning: z.string().min(10).max(500),
  red_flags: z.array(z.string()).max(10)
})
```

If OpenAI returns invalid JSON or schema mismatch → throw `AIResponseValidationError` and fail the job.

---

## Security Rules

- Rate limit `/api/ai/*` endpoints: max 20 requests per minute per HR user
- Sanitize `resumeText` before sending to OpenAI (remove prompt injection attempts)
- Never log raw OpenAI API keys
- Validate OpenAI response before touching the DB
- Set `max_tokens: 1500` on resume analysis calls
- Set `temperature: 0.1` for deterministic scoring

---

## Output Checklist

- [ ] All 5 files generated and compilable
- [ ] OpenAI called with `response_format: { type: 'json_object' }`
- [ ] BullMQ queues defined with proper Redis connection
- [ ] Auto-shortlisting logic implemented in resume analysis worker
- [ ] Zod validation on all AI responses
- [ ] Prompt injection sanitization in `resumeParser.ts`
- [ ] Audit log entries written on success and failure
- [ ] Job progress tracking (0–100) implemented
- [ ] Rate limiting applied to AI endpoints
