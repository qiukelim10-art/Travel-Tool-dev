# AGENTS.md

## CodeGraph Usage Rule

Before making code changes, Codex must use CodeGraph to understand the related files and references.

For every task:
1. Identify related files, components, API routes, shared types, and database schema.
2. Explain why each file is relevant.
3. List possible affected pages or features.
4. Propose the minimal edit plan before editing.
5. After editing, re-check related references to avoid missing linked files.
6. Do not make broad refactors unless explicitly requested.

## 1. Project Memory Workflow

### 1.1 Required Reading

At the start of every task, read these files first if they exist:

1. `AGENTS.md`
2. `MEMORY_INDEX.md`
3. `NEXT_TASKS.md`

Then read these files only when relevant to the current task:

* `PROJECT_CONTEXT.md`
* `PROGRESS.md`
* `DECISIONS.md`

### 1.2 Memory Usage Rules

* Do not read all memory files every time.
* Read only the files relevant to the current task.
* Treat project files and actual code as the source of truth.
* Do not rely on previous chat history if it conflicts with project files.
* Avoid loading irrelevant context to save tokens.

---

## 2. Engineering Discipline

### 2.1 Minimal Change Policy

* Prefer the smallest change that fixes the root cause.
* Do not refactor unrelated code.
* Do not rename files, move folders, or change architecture unless required.
* Do not introduce new dependencies unless no reasonable existing solution exists.
* Do not create unnecessary new files.
* Reuse existing modules, components, services, hooks, helpers, and utilities whenever possible.
* Avoid complex abstractions for small problems.

### 2.2 Diagnose Before Fixing

When an issue or error occurs, inspect these first:

* logs
* stack traces
* configuration files
* related source files

Before editing code, explain briefly:

* the suspected root cause
* the files you plan to modify
* the proposed fix

Do not guess repeatedly.
If the first fix fails, use the new error output to continue diagnosis.

### 2.3 Implementation Style

* Follow the existing project structure.
* Follow the existing naming conventions.
* Follow the existing coding style.
* Prefer simple, readable implementation.
* Avoid premature abstraction.
* Do not design for hypothetical future requirements.
* Add comments only when they explain non-obvious business logic or technical decisions.

---

## 3. External Research Rules

If project files are not enough to answer or implement the task:

1. Read project files first.
2. Then check external sources if needed.
3. Prefer official documentation over third-party articles.
4. Summarize the findings before implementation.
5. Do not assume external API behavior without checking documentation.

---

## 4. Verification Rules

After making changes, run the most relevant available verification command.

Preferred order:

1. tests
2. lint
3. type check
4. build
5. app startup
6. minimal API verification

If a command cannot be run:

* explain why
* provide the exact command the user should run
* describe the expected result

Do not modify code without attempting verification.

When asking the user to review a completed website change, always provide verified desktop and phone LAN URLs. Include the port, desktop page HTTP status, phone LAN page HTTP status, and related API status. If phone access requires the same Wi-Fi or hotspot as the computer, state that clearly.

---

## 5. Completion Workflow

### 5.1 Update Memory Files

After completing a task, update these files when relevant:

* `PROGRESS.md`
* `NEXT_TASKS.md`

Update `DECISIONS.md` if an important technical decision was made.

Update `MEMORY_INDEX.md` if any of these changed:

* project status
* highest priority task
* key known issue
* important architecture note

### 5.2 Memory Writing Rules

Do not write these into memory files:

* long logs
* full error outputs
* large code blocks
* unrelated details

Only record:

* conclusion
* root cause
* modified files
* important decision
* next task

---

## 6. Final Response Format

At the end of each task, respond in Chinese using this structure:

### 已读取

* Memory files read
* Key project files read

### 已修改

* Modified files
* Summary of changes

### 问题解决情况

* Root cause
* Solution
* Verification result

### 下一步

* Commands the user should run
* Suggested next task




# Italy Trip 2026 Project Memory

## Purpose

This project is a private travel dashboard for a 4-person Italy trip in October 2026. It is meant to be useful during the trip, especially on phones.

## Project Rules

- Keep user-facing project files and generated outputs under `C:\Codex` by default.
- This website is for the 4 travellers only, not for the public.
- Do not store real passport numbers, identity documents, payment card details, insurance certificates, or booking confirmation files in the repo.
- Use placeholder data until the travellers intentionally replace it with real trip details.
- Keep all core trip data centralized in `src/data/tripData.ts`.
- Prefer clear, mobile-first utility over decorative travel marketing design.
- For Phase 1, do not add password protection unless requested later.

## Phase 1 Scope

Build these pages first:

- Dashboard
- Itinerary
- Bookings
- Budget
- Emergency

Use static data and no backend.
