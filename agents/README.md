# HireOn — Agentic Development Agents

## Overview
This folder contains 7 Claude Code agent instruction files for building the **HireOn** AI Hiring Intelligence Platform end-to-end. Each `.md` file is a self-contained agent prompt — drop it into Claude Code and it generates the corresponding layer of the stack.

---

## Execution Order

| # | Agent File | What It Builds | Depends On |
|---|-----------|---------------|------------|
| 1 | `01-scaffold-agent.md` | Full project structure, all stub files, package.json, tsconfig | Nothing |
| 2 | `02-schema-migration-agent.md` | Prisma schema, Neon migrations, seed script | Agent 1 |
| 3 | `03-auth-agent.md` | Custom JWT auth, bcrypt, refresh tokens, login/register pages | Agent 1, 2 |
| 4 | `04-ai-module-agent.md` | OpenAI integration, BullMQ jobs, resume analysis, auto-shortlisting | Agent 1, 2 |
| 5 | `05-scheduling-agent.md` | Slot matching algorithm, Google Calendar, email notifications | Agent 1, 2, 3 |
| 6 | `06-frontend-panel-agent.md` | All 3 dashboards (HR, Interviewer, Candidate) in Next.js | Agent 1, 3 |
| 7 | `07-test-audit-agent.md` | Jest tests, collision tests, security audit, CI pipeline | All above |

---

## How to Use in Claude Code

1. Open Claude Code in your project root
2. Say: "Follow the instructions in `01-scaffold-agent.md` and build the project"
3. Claude Code reads the file and executes it
4. Repeat for each agent in order

Or chain them:
> "Execute agents 1 through 3 in sequence, verifying each compiles before proceeding"

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind, Shadcn/UI, Zustand, React Query |
| Backend | Node.js, Express, TypeScript, Prisma |
| Database | Neon PostgreSQL (serverless) |
| Auth | Custom JWT (no Supabase) |
| Queue | BullMQ + Redis (Upstash) |
| AI | OpenAI GPT-4o |
| Calendar | Google Calendar API (Service Account) |
| Email | Resend |
| Tests | Jest + Supertest |
| CI | GitHub Actions |
