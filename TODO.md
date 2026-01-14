# TODO: Lucie 2.0 Improvements

> **Last Updated**: 2026-01-14
> **Production Readiness**: 70%

This document tracks improvements needed to bring Lucie 2.0 to production-ready status.

---

## 🚨 Critical Issues (Priority 1) - Fix Immediately

### [✅] 1. Fix Data Corruption Bug in Sync Script
**File**: `src/db/sync-from-airtable.ts:93`
**Issue**: Field mappings are misaligned, causing founder data to be mapped to incorrect fields
```typescript
// Current (BROKEN):
name: fields['Email'] as string | undefined,
email: fields['Education'] as string | undefined,
whatsapp: fields['Track record...'] as string | undefined,

// Need to fix field mappings to match actual Airtable structure
```
**Impact**: Production data quality - founders have wrong information
**Estimate**: 2-4 hours
**Dependencies**: None

### [ ] 2. Fix or Remove Broken Batch Filtering
**File**: `src/db/helpers/query-all-founders.ts:128`
**Issue**: `getFoundersByBatch()` returns all founders regardless of batch parameter
**Options**:
- Option A: Add `batch` field to founders schema + update migrations
- Option B: Remove `by-batch` search type from `queryFoundersTool`
**Impact**: Agent makes false promises to users
**Estimate**: 3-5 hours (Option A), 30 minutes (Option B)
**Dependencies**: None

### [ ] 3. Fix Agent Instructions - Remove Non-Existent Tool References
**File**: `src/mastra/agents/lucie-instructions.ts`
**Issue**: Instructions reference tools not in agent configuration
**Tasks**:
- [ ] Remove references to `getCohortDataTool` (lines 33+)
- [ ] Remove references to "AI Lab tool" (not implemented)
- [ ] Update tool selection rules to only reference active tools
**Impact**: Agent confusion during tool selection
**Estimate**: 1-2 hours
**Dependencies**: None

---

## ⚠️ High Priority (Priority 2) - Complete Within 1 Week

### [ ] 4. Add Testing Infrastructure
**Status**: Currently 0% test coverage
**Tasks**:
- [ ] Install and configure Vitest
  ```bash
  pnpm add -D vitest @vitest/ui
  ```
- [ ] Update `package.json` test script
- [ ] Create `/tests` directory structure:
  ```
  tests/
    unit/
      db/helpers/
      mastra/tools/
    integration/
      agent/
      slack/
    fixtures/
    setup.ts
  ```
- [ ] Write tests for database helpers:
  - [ ] `query-all-founders.ts` (all search types)
  - [ ] `query-sessions.ts` (temporal queries, speaker search)
  - [ ] `query-startups.ts` (industry, team member search)
- [ ] Write tests for tools:
  - [ ] `queryFoundersTool` (with mocked DB)
  - [ ] `querySessionsTool` (with mocked DB)
  - [ ] `queryStartupsTool` (with mocked DB)
- [ ] Add test coverage reporting
- [ ] Set coverage targets (aim for 70%+ critical paths)
**Impact**: Code quality, regression prevention
**Estimate**: 3-5 days
**Dependencies**: None

### [ ] 5. Fix Mastra Storage - Make Persistent
**File**: `src/mastra/index.ts:13`
**Current**: `url: ':memory:'` (ephemeral)
**Change to**: `url: 'file:../mastra.db'`
**Tasks**:
- [ ] Update storage configuration
- [ ] Add `.mastra.db` to `.gitignore`
- [ ] Document backup strategy in README
- [ ] Test conversation memory persistence across restarts
**Impact**: Production stability, observability data retention
**Estimate**: 1-2 hours
**Dependencies**: None

### [ ] 6. Add Database Indexes
**Files**: `src/db/schemas/*.ts`
**Tasks**:
- [ ] Add index on `founders.name` (by-name searches)
  ```typescript
  .index('idx_founders_name').on(founders.name)
  ```
- [ ] Add index on `founders.techSkills` (by-skills searches)
- [ ] Add index on `sessionEvents.date` (upcoming/past queries)
- [ ] Add index on `sessionEvents.speaker` (by-speaker searches)
- [ ] Add index on `startups.industry` (by-industry searches)
- [ ] Generate and apply migrations
  ```bash
  pnpm dbg && pnpm dbm
  ```
- [ ] Test query performance improvement
**Impact**: Query performance at scale
**Estimate**: 2-3 hours
**Dependencies**: None

### [ ] 7. Add Rate Limiting to Slack Webhooks
**File**: `src/mastra/slack/routes.ts`
**Tasks**:
- [ ] Install rate limiting library
  ```bash
  pnpm add express-rate-limit
  ```
- [ ] Add rate limiter middleware to Slack routes
  ```typescript
  // Example: 30 requests per minute per IP
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30
  });
  ```
- [ ] Add rate limit headers to responses
- [ ] Test with simulated traffic
**Impact**: Security, prevent abuse
**Estimate**: 2-3 hours
**Dependencies**: None

---

## 📈 Medium Priority (Priority 3) - Complete Within 2-4 Weeks

### [ ] 8. Add Code Quality Tools
**Tasks**:
- [ ] Install ESLint + Prettier
  ```bash
  pnpm add -D eslint prettier eslint-config-prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
  ```
- [ ] Create `.eslintrc.json` configuration
- [ ] Create `.prettierrc` configuration
- [ ] Add format/lint scripts to `package.json`:
  ```json
  "lint": "eslint . --ext .ts,.tsx",
  "format": "prettier --write \"**/*.{ts,tsx,json,md}\""
  ```
- [ ] Run formatter on entire codebase
- [ ] Fix linting errors
**Estimate**: 3-4 hours

### [ ] 9. Add Pre-Commit Hooks
**Tasks**:
- [ ] Install Husky + lint-staged
  ```bash
  pnpm add -D husky lint-staged
  pnpm exec husky init
  ```
- [ ] Configure `.husky/pre-commit`
- [ ] Configure `lint-staged` in `package.json`:
  ```json
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"],
    "*.md": ["prettier --write"]
  }
  ```
- [ ] Test pre-commit hook
**Estimate**: 1-2 hours
**Dependencies**: Task #8 (ESLint/Prettier)

### [ ] 10. Create .env.example File
**File**: Create `.env.example` in root
**Tasks**:
- [ ] Document all required environment variables
- [ ] Add descriptions for each variable
- [ ] Include example values (non-sensitive)
- [ ] Document which variables are required vs optional
- [ ] Link to setup documentation
**Estimate**: 30 minutes
**Dependencies**: None

### [ ] 11. Archive Historical Documentation
**Tasks**:
- [ ] Create `docs/history/` directory
- [ ] Move completed migration docs:
  - [ ] `TURSO_MIGRATION_COMPLETE.md`
  - [ ] `SEED_VERIFICATION.md`
  - [ ] `GRID_DATA_INTEGRATION.md`
  - [ ] `QUERY_FOUNDERS_TOOL_SETUP.md`
  - [ ] `QUERY_SESSIONS_TOOL_SETUP.md`
  - [ ] `QUERY_STARTUPS_TOOL_SETUP.md`
  - [ ] `UNIFIED_VIEW_FIX.md`
- [ ] Update `CLAUDE.md` to reference new locations
- [ ] Add `docs/history/README.md` explaining archived docs
**Estimate**: 30 minutes
**Dependencies**: None

### [ ] 12. Add Caching Layer
**Tasks**:
- [ ] Evaluate caching strategy (in-memory vs Redis)
- [ ] Install caching library (e.g., `node-cache` or `ioredis`)
- [ ] Identify cacheable queries:
  - All founders list
  - Upcoming sessions
  - All startups list
- [ ] Implement cache wrapper for database helpers
- [ ] Add cache invalidation strategy
- [ ] Add cache hit/miss metrics
- [ ] Configure TTL for different data types
**Estimate**: 1-2 days
**Dependencies**: None

### [ ] 13. Set Up CI/CD Pipeline
**Tasks**:
- [ ] Create `.github/workflows/ci.yml`
- [ ] Add workflow steps:
  - [ ] Checkout code
  - [ ] Setup Node.js + pnpm
  - [ ] Install dependencies
  - [ ] Run linter
  - [ ] Run tests
  - [ ] Build project
  - [ ] Run type checking
- [ ] Add workflow status badge to README
- [ ] Create deployment workflow (if applicable)
**Estimate**: 3-4 hours
**Dependencies**: Tasks #4 (tests), #8 (linting)

### [ ] 14. Add Query Performance Monitoring
**Tasks**:
- [ ] Create performance logging utility in `lib/`
- [ ] Add query timing to database helpers:
  ```typescript
  const start = Date.now();
  const result = await db.select()...;
  logger.debug({ duration: Date.now() - start, query: 'founders.all' });
  ```
- [ ] Add slow query detection (>200ms threshold)
- [ ] Create performance metrics dashboard (optional)
- [ ] Document query performance baselines
**Estimate**: 1-2 days
**Dependencies**: None

### [ ] 15. Improve Secret Management
**Tasks**:
- [ ] Research secret management solutions:
  - AWS Secrets Manager
  - HashiCorp Vault
  - Doppler
- [ ] Choose solution based on deployment environment
- [ ] Implement secret fetching on startup
- [ ] Remove secrets from `.env` (production only)
- [ ] Document secret rotation process
- [ ] Add secret refresh mechanism
**Estimate**: 2-3 days
**Dependencies**: Deployment environment decision

---

## 🔮 Long Term (Priority 4) - Complete Within 1-3 Months

### [ ] 16. Complete AI Lab Tool Implementation
**Status**: Infrastructure exists, tool not implemented
**Files**:
- `bff/ai-lab/models/ai-lab-model.ts` (exists)
- `bff/ai-lab/services/ai-lab-service.ts` (exists)
- `src/mastra/tools/ai-lab-tool.ts` (needs creation)
**Tasks**:
- [ ] Define requirements for AI Lab queries
- [ ] Create AI Lab schema in `src/db/schemas/`
- [ ] Implement `queryAiLabTool.ts`
- [ ] Add tool to agent configuration
- [ ] Update agent instructions
- [ ] Test with real AI Lab data
**Estimate**: 1-2 weeks
**Dependencies**: Requirements clarification

### [ ] 17. Implement Agent Scorer
**File**: `src/mastra/scorers/lucie-scorer.ts`
**Current**: Template only (copied from weather example)
**Tasks**:
- [ ] Define scoring criteria for Lucie:
  - Accuracy (correct tool selection)
  - Helpfulness (answers user question)
  - Tone (professional, concise)
  - Formatting (Slack-friendly)
- [ ] Implement scoring functions
- [ ] Create evaluation dataset (sample queries + expected outputs)
- [ ] Run baseline evaluation
- [ ] Set up continuous evaluation pipeline
- [ ] Document scoring thresholds
**Estimate**: 1-2 weeks
**Dependencies**: Task #4 (testing infrastructure)

### [ ] 18. Implement Workflow Orchestration
**File**: `src/mastra/workflows/`
**Current**: Example workflow exists but unused
**Potential Use Cases**:
- Multi-step data processing
- Complex query orchestration
- Cross-table data aggregation
**Tasks**:
- [ ] Identify workflow use cases
- [ ] Design workflow architecture
- [ ] Implement first workflow (TBD)
- [ ] Integrate with agent
- [ ] Test and document
**Estimate**: 2-3 weeks
**Dependencies**: Use case identification

### [ ] 19. Add A/B Testing for Agent Instructions
**Tasks**:
- [ ] Design instruction versioning system
- [ ] Create instruction variants (A/B versions)
- [ ] Implement routing logic (50/50 split)
- [ ] Add metrics collection:
  - Tool selection accuracy
  - User satisfaction (if available)
  - Response time
  - Error rates
- [ ] Create comparison dashboard
- [ ] Document rollout process
**Estimate**: 2-3 weeks
**Dependencies**: Task #17 (scorer for evaluation)

### [ ] 20. Plan Mastra GA Migration
**Current**: Using Mastra v1.0.0-beta.19
**Tasks**:
- [ ] Monitor Mastra release schedule
- [ ] Review GA changelog when available
- [ ] Identify breaking changes
- [ ] Create migration plan
- [ ] Test in staging environment
- [ ] Update dependencies
- [ ] Deploy to production
**Estimate**: 1-2 weeks (when GA released)
**Dependencies**: Mastra GA release

### [ ] 21. Add Comprehensive Integration Tests
**Tasks**:
- [ ] Set up integration test environment
- [ ] Create test fixtures for:
  - Slack events
  - Terminal CLI sessions
  - Database state
- [ ] Write end-to-end tests:
  - [ ] Slack message → agent response
  - [ ] Terminal CLI conversation flow
  - [ ] Tool execution with real database
  - [ ] Memory persistence across turns
- [ ] Add CI integration
**Estimate**: 1-2 weeks
**Dependencies**: Task #4 (testing infrastructure)

### [ ] 22. Create Architecture Documentation
**Tasks**:
- [ ] Create architecture diagrams:
  - System overview (high-level)
  - Data flow diagram
  - Slack integration flow
  - Database schema diagram
- [ ] Document design decisions
- [ ] Create API reference (TypeDoc)
- [ ] Add sequence diagrams for complex flows
- [ ] Publish to wiki or docs site
**Estimate**: 3-5 days
**Dependencies**: None

### [ ] 23. Optimize Agent Instructions
**Current**: 252 lines of instructions
**Tasks**:
- [ ] Analyze token usage per request
- [ ] Split instructions into:
  - Core instructions (always included)
  - Tool-specific instructions (injected dynamically)
- [ ] Implement dynamic instruction composition
- [ ] A/B test instruction length impact
- [ ] Document optimal instruction patterns
**Estimate**: 1-2 weeks
**Dependencies**: Task #19 (A/B testing)

---

## 📊 Progress Tracking

### By Priority
- **Critical (P1)**: 0/3 completed (0%)
- **High (P2)**: 0/4 completed (0%)
- **Medium (P3)**: 0/8 completed (0%)
- **Long Term (P4)**: 0/8 completed (0%)

### By Category
- **Bug Fixes**: 0/3 completed
- **Testing**: 0/3 completed
- **Infrastructure**: 0/6 completed
- **Security**: 0/2 completed
- **Performance**: 0/3 completed
- **Documentation**: 0/2 completed
- **Features**: 0/4 completed

### Production Readiness Checklist
- [ ] Critical bugs fixed (Tasks #1-3)
- [ ] Test coverage >70% (Task #4)
- [ ] Persistent storage (Task #5)
- [ ] Database optimized (Task #6)
- [ ] Security hardened (Task #7, #15)
- [ ] Monitoring in place (Task #14)
- [ ] CI/CD pipeline (Task #13)
- [ ] Documentation complete (Task #22)

**Target Production Date**: _TBD based on priority completion_

---

## 🎯 Sprint Planning Suggestions

### Week 1: Critical Fixes
- Tasks #1, #2, #3 (critical bugs)
- Task #10 (`.env.example`)
- Task #11 (archive docs)

### Week 2: Testing & Stability
- Task #4 (testing infrastructure)
- Task #5 (persistent storage)
- Task #6 (database indexes)

### Week 3: Security & Quality
- Task #7 (rate limiting)
- Task #8 (ESLint/Prettier)
- Task #9 (pre-commit hooks)
- Task #13 (CI/CD)

### Week 4: Performance & Monitoring
- Task #12 (caching)
- Task #14 (performance monitoring)

---

## 📝 Notes

### Dependencies Status
- **Mastra**: v1.0.0-beta.19 (beta, API may change)
- **Node.js**: >=22.13.0 required
- **Package Manager**: pnpm v10.27.0

### Environment Requirements
- Turso database connection
- Airtable API access
- Slack app credentials
- Anthropic/OpenAI API keys

### Helpful Commands
```bash
# Run tests (after Task #4)
pnpm test

# Lint code (after Task #8)
pnpm lint

# Format code (after Task #8)
pnpm format

# Database operations
pnpm dbg      # Generate migrations
pnpm dbm      # Apply migrations
pnpm dbs      # Open Drizzle Studio
pnpm db:sync  # Sync from Airtable

# Development
pnpm dev      # Start Mastra server
pnpm dev:cli  # Start terminal CLI
```

---

**Last Review Date**: 2026-01-14
**Next Review**: After completing P1 tasks
