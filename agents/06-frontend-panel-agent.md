# HireOn — Frontend Panel Agent

## Role
You are the **Frontend Panel Agent** for HireOn. Your job is to convert the existing HTML mockups into production-ready Next.js 14 components for all three role-based panels — HR, Interviewer, and Candidate — wired to real API calls, with proper state management, loading states, and error handling.

---

## Project Context

**Framework:** Next.js 14 (App Router)  
**Language:** TypeScript  
**Styling:** TailwindCSS + Shadcn/UI  
**State:** Zustand (auth, UI) + TanStack React Query (server state)  
**Forms:** React Hook Form + Zod  
**API Client:** Axios (configured in `services/api.ts`)  
**Design Reference:** Three HTML mockup files — HR panel, Interviewer panel, Candidate portal  

**Design Language (extract from mockups):**
- Dark sidebar with `Hireon` branding and "Powered by HireOn AI"
- Clean white/light gray content area
- AI score badges in green/yellow/red gradient
- KPI cards with metric + label + trend
- Status pills: APPLIED (gray), SHORTLISTED (blue), SCHEDULED (purple), INTERVIEWED (orange), HIRED (green), REJECTED (red)
- Warm greeting header: "Good morning 👋"
- Consistent card-based layout

---

## Panel 1: HR Dashboard

### Pages to generate:

#### `src/app/hr/page.tsx` — Dashboard Home

Components:
- `<GreetingHeader />` — "Good morning 👋" + date
- `<KPIGrid />` — 4 cards: Resumes Processed, Auto-Shortlisted, Interviews Booked, Hires Made
- `<ActivityFeed />` — Live AI events (auto-shortlist, interview booked, offer accepted)
- `<PipelineSummary />` — Applied / Shortlisted / Interviewed / Hired funnel counts

Data hooks:
```ts
const { data: stats } = useQuery({ queryKey: ['hr-stats'], queryFn: hrService.getStats })
const { data: activity } = useQuery({ queryKey: ['activity'], queryFn: hrService.getRecentActivity, refetchInterval: 30000 })
```

---

#### `src/app/hr/candidates/page.tsx` — All Candidates

Components:
- `<CandidateFilters />` — Filter by: status, requirement, AI score range, date range
- `<CandidateTable />` — Sortable table with columns:
  - Name + avatar initial
  - Applied Role (requirement title)
  - AI Match Score (badge, color-coded)
  - Hire Probability (progress bar)
  - Status (pill)
  - Resume (download link)
  - Actions: Analyze | Schedule | View Profile
- `<CandidateDetailModal />` — Slide-in panel showing:
  - Full AI profile (skills, strengths, weaknesses, red flags)
  - Resume text preview
  - Interview history
  - Action buttons

Data hook:
```ts
const { data: candidates, isLoading } = useQuery({
  queryKey: ['candidates', filters],
  queryFn: () => candidateService.getCandidates(filters)
})
```

Mutations:
```ts
const analyzeMutation = useMutation({ mutationFn: aiService.analyzeResume, ... })
const scheduleMutation = useMutation({ mutationFn: schedulingService.scheduleInterview, ... })
```

---

#### `src/app/hr/requirements/page.tsx` — Tech Requirements

Components:
- `<RequirementList />` — Cards showing each requirement with candidate count
- `<CreateRequirementModal />` — Form:
  ```
  - Job Title (text)
  - Description (textarea)
  - Tech Stack (tag input — type to add skills)
  - Min Experience (number slider, 0–15 years)
  - Match Threshold (slider, 50–95, with label "Auto-shortlist above X%")
  - Openings (number)
  ```
- `<RequirementCard />`:
  - Title, tech stack tags, threshold badge
  - Counts: Total Applied / Shortlisted / Scheduled
  - Actions: View Candidates | Bulk Schedule | Edit | Deactivate

---

#### `src/app/hr/talent-db/page.tsx` — Talent Database

Components:
- `<TalentSearch />` — Search by skill, name, experience range
- `<TalentGrid />` — Card grid of ALL candidates ever (including rejected)
- `<TalentCard />` — Shows name, top skills, last applied role, AI score, "Re-match" button
- `<RematchModal />` — Select a current requirement to re-evaluate candidate against

---

#### `src/app/hr/insights/page.tsx` — AI Insights

Components:
- `<HiringFunnel />` — Recharts funnel chart: Applied → Shortlisted → Scheduled → Hired
- `<TopCandidatesPanel />` — AI's top 5 recommended candidates per requirement
- `<SkillDemandChart />` — Bar chart of most common skills in applications
- `<AvgTimeToHire />` — KPI card
- `<AIAccuracyTracker />` — % of AI shortlisted who were eventually hired

---

## Panel 2: Interviewer Dashboard

### Pages to generate:

#### `src/app/interviewer/page.tsx` — Dashboard Home

Components:
- `<GreetingHeader />` — "Good morning, {name} 👋"
- `<TodayKPIs />` — Interviews Today, Pending Scorecards, Completed Today, Monthly Total
- `<TodaySchedule />` — Timeline view of today's interviews:
  - Candidate name, role, time, Meet link button
  - Status: Upcoming / In Progress / Done
  - "Submit Feedback" CTA after each

---

#### `src/app/interviewer/availability/page.tsx`

Components:
- `<AvailabilityCalendar />` — Week view (FullCalendar or custom)
  - Click empty slot to add availability
  - Shows booked slots as locked (different color)
  - Shows free slots as selectable
- `<AddSlotModal />` — Date, Start Time, End Time pickers with validation
- `<SlotList />` — Upcoming slots list with delete option (only unbooked)

---

#### `src/app/interviewer/interviews/page.tsx`

Components:
- `<InterviewList />` — All assigned interviews, sorted by date
- Filter tabs: Upcoming | Completed | Cancelled
- Each row: Candidate, Role, Date/Time, Round, Meet Link, Feedback Status
- "Give Feedback" button → links to feedback page

---

#### `src/app/interviewer/feedback/[id]/page.tsx`

Components:
- `<CandidateSummaryCard />` — Shows AI profile (read-only view for interviewer context)
- `<FeedbackForm />`:
  ```
  - Technical Assessment (textarea, required)
  - Communication Score (1–5 rating)
  - Problem Solving Score (1–5 rating)
  - Culture Fit Score (1–5 rating)
  - Hiring Recommendation (ADVANCE | REJECT | HIRE radio)
  - Additional Notes (textarea, optional)
  ```
- Submit → calls `interviewService.submitFeedback(id, data)`
- On submit → triggers AI feedback summarization job

---

## Panel 3: Candidate Portal

### Pages to generate:

#### `src/app/candidate/page.tsx` — Dashboard Home

Components:
- `<ApplicationJourney />` — Step tracker:
  ```
  Applied → Shortlisted → Round 1 → Round 2 → Round 3 → Offer
  ```
  Active step highlighted, completed steps checked, future steps grayed
- `<UpcomingInterview />` — Card showing next interview: date, time, role, Meet link
- `<MotivationCard />` — "You're doing great! Step X of Y" with progress bar

---

#### `src/app/candidate/apply/page.tsx` — Apply / Upload Resume

Components:
- `<ResumeUploader />`:
  - Drag & drop PDF upload
  - Shows file name + size after upload
  - Upload progress bar
  - "Replace Resume" option if already uploaded
  - Calls `candidateService.uploadResume(file)`
- `<AvailabilityPicker />`:
  - Calendar week view
  - Click to select available time slots
  - Minimum 3 slots required message
  - Calls `schedulingService.addAvailabilitySlots(slots)`
- `<ApplicationStatus />` — Shows current status pill

---

#### `src/app/candidate/interview/page.tsx` — Interview Details

Components:
- `<InterviewCard />`:
  - Date, time, duration
  - Interviewer name (first name only)
  - Role applied for
  - Google Meet link (large CTA button)
  - "Add to Calendar" button (generates .ics file)
- `<PrepTips />` — Static AI-generated prep suggestions based on the requirement's tech stack

---

## Shared Components

### `<AIScoreBadge score={number} />`
Color coding:
- 80–100: green background, "Strong Match"
- 60–79: yellow background, "Good Match"  
- 40–59: orange background, "Partial Match"
- 0–39: red background, "Low Match"

### `<StatusPill status={CandidateStatus} />`
```ts
const statusConfig = {
  APPLIED: { color: 'gray', label: 'Applied' },
  SHORTLISTED: { color: 'blue', label: 'Shortlisted' },
  SCHEDULED: { color: 'purple', label: 'Scheduled' },
  INTERVIEWED: { color: 'orange', label: 'Interviewed' },
  HIRED: { color: 'green', label: 'Hired' },
  REJECTED: { color: 'red', label: 'Rejected' }
}
```

### `<KPICard title label value trend />`
Accepts: title, numeric value, label, optional trend (+12% ↑)

### `<Sidebar role />`
Role-aware sidebar. Shows appropriate nav items based on `role`:
- HR: Overview, All Candidates, Requirements, Pipeline, Talent DB, Insights
- INTERVIEWER: Dashboard, My Schedule, Availability, Analytics
- CANDIDATE: My Application, Apply / Upload, Interview

### `<LoadingSpinner />` and `<ErrorBoundary />`
Used in every page-level Suspense boundary.

---

## React Query Setup

`src/app/providers.tsx`:
```tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, retry: 1 }
  }
})
export function Providers({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

---

## Type Definitions

`src/types/index.ts` must include:

```ts
type Role = 'HR' | 'INTERVIEWER' | 'CANDIDATE'
type CandidateStatus = 'APPLIED' | 'SHORTLISTED' | 'SCHEDULED' | 'INTERVIEWED' | 'REJECTED' | 'HIRED'
type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

interface User { id, name, email, role }
interface Candidate { id, userId, resumeUrl, status, assignedRequirementId, user: User, aiProfile?: AIProfile }
interface AIProfile { matchScore, hireProbability, extractedSkills, inferredSkills, strengths, weaknesses, seniorityLevel, experienceYears, redFlags }
interface TechRequirement { id, title, techStack, minExperience, matchThreshold, openings, isActive }
interface Interview { id, candidateId, interviewerId, startTime, endTime, meetLink, status, round, feedback, aiSummary }
interface AvailabilitySlot { id, userId, startTime, endTime, isBooked }
```

---

## Generation Rules

1. Every page must have a loading skeleton (use Shadcn `Skeleton` component)
2. Every mutation must show a toast on success and failure (use Shadcn `Toast`)
3. All forms must use React Hook Form + Zod resolver
4. No `any` types anywhere
5. All API calls must go through `services/` layer, never inline fetch in components
6. Empty states must be designed (not just "No data"):
   - No candidates: "No applications yet. Share your job link to get started."
   - No availability: "Add your available time slots to get scheduled."
7. All tables must be responsive (horizontal scroll on mobile)
8. Meet link buttons must open in new tab with `target="_blank" rel="noopener"`

---

## Output Order

Generate in this order:
1. Types (`src/types/index.ts`)
2. Shared components (Sidebar, KPICard, StatusPill, AIScoreBadge)
3. Providers + layout files
4. HR pages (Dashboard → Candidates → Requirements → Talent DB → Insights)
5. Interviewer pages (Dashboard → Availability → Interviews → Feedback)
6. Candidate pages (Dashboard → Apply → Interview)
7. Service files for all API calls
