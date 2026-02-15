---
name: research-questions
description: CRUD management for custom AI research questions/qualifiers that are merged into AI research prompts during property analysis generation.
---

# Research Questions Skill

## Purpose

Manages user-defined research questions that customize what the AI analyzes during property market research generation. Questions are stored in the database and automatically merged into AI prompts via the `customQuestions` field in `researchVariables`.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│         Settings > Industry Research Tab              │
│  ┌────────────────────────────────────────────────┐  │
│  │  Research Questions List                        │  │
│  │  ┌──────────────────────────────────┐          │  │
│  │  │ 1. What is the avg pricing...   ✏️ 🗑️ │  │
│  │  │ 2. How do boutique hotels...    ✏️ 🗑️ │  │
│  │  │ + Add Question                          │  │
│  │  └──────────────────────────────────┘          │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────┘
                       │ React Query hooks
                       ▼
┌──────────────────────────────────────────────────────┐
│         API Routes (server/routes.ts)                 │
│  GET    /api/research-questions                       │
│  POST   /api/research-questions                       │
│  PUT    /api/research-questions/:id                   │
│  DELETE /api/research-questions/:id                   │
└──────────────────────┬───────────────────────────────┘
                       │ IStorage methods
                       ▼
┌──────────────────────────────────────────────────────┐
│         Database (researchQuestions table)             │
│  id | question | sortOrder | createdAt                │
└──────────────────────┬───────────────────────────────┘
                       │ Fetched during research gen
                       ▼
┌──────────────────────────────────────────────────────┐
│         AI Research Generation (server/routes.ts)     │
│  Questions fetched → joined as customQuestions →      │
│  merged into researchVariables → sent to AI prompt    │
└──────────────────────────────────────────────────────┘
```

## Data Flow

### CRUD Operations

1. **Create**: User types question in input, clicks "Add" or presses Enter → `POST /api/research-questions` → auto-assigns next `sortOrder`
2. **Read**: Page loads → `GET /api/research-questions` → ordered by `sortOrder ASC`
3. **Update**: User clicks pencil icon → inline edit mode → Enter to save or Escape to cancel → `PUT /api/research-questions/:id`
4. **Delete**: User clicks trash icon → `DELETE /api/research-questions/:id`

### AI Prompt Integration

When AI research is triggered (`POST /api/market-research/property/:id/generate`):
1. Server fetches all research questions from DB via `storage.getResearchQuestions()`
2. Questions are joined with newlines: `questions.map(q => q.question).join('\n')`
3. Result is set as `researchVariables.customQuestions`
4. The `customQuestions` field is included in the AI prompt template sent to the LLM

## Database Schema

```typescript
export const researchQuestions = pgTable("research_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});
```

## Key Files

| File | Purpose |
|------|---------|
| `shared/schema.ts` | `researchQuestions` table definition, insert/select schemas |
| `server/storage.ts` | `IStorage` interface + `DatabaseStorage` CRUD methods |
| `server/routes.ts` | API endpoints + AI prompt integration |
| `client/src/lib/api.ts` | React Query hooks (`useResearchQuestions`, `useCreateResearchQuestion`, `useUpdateResearchQuestion`, `useDeleteResearchQuestion`) |
| `client/src/pages/Settings.tsx` | UI rendering in Industry Research tab |

## Storage Interface

```typescript
// IStorage methods
getResearchQuestions(): Promise<ResearchQuestion[]>
createResearchQuestion(question: InsertResearchQuestion): Promise<ResearchQuestion>
updateResearchQuestion(id: number, question: string): Promise<ResearchQuestion>
deleteResearchQuestion(id: number): Promise<void>
```

## React Query Hooks

```typescript
// Fetch all questions (ordered by sortOrder)
useResearchQuestions(): UseQueryResult<ResearchQuestion[]>

// Create a new question (auto-assigns sortOrder)
useCreateResearchQuestion(): UseMutationResult

// Update question text by ID
useUpdateResearchQuestion(): UseMutationResult

// Delete question by ID
useDeleteResearchQuestion(): UseMutationResult
```

All mutations invalidate the `["/api/research-questions"]` query key for cache consistency.

## UI Patterns

- **Inline editing**: Click pencil icon → input field replaces text → Enter to save, Escape to cancel
- **Hover actions**: Edit and delete icons appear on hover (opacity transition)
- **Empty state**: Shows helpful message when no questions exist
- **Add flow**: Input at bottom with "Add" button, clears on success
- **Theme-aware**: Uses glass card styling consistent with Settings page

## Related Rules

- `.claude/rules/api-routes.md` — API route conventions and auth middleware
- `.claude/rules/recalculate-on-save.md` — mutations invalidate relevant queries
- `.claude/rules/button-label-consistency.md` — "Save" not "Update" for save actions

## Related Skills

- `.claude/skills/research/SKILL.md` — Master research system skill
- `.claude/skills/architecture/SKILL.md` — System architecture and IStorage pattern
- `.claude/skills/ui/entity-cards.md` — CRUD list UI patterns
