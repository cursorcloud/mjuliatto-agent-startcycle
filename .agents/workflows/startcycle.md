# Workflow: Start Cycle

## Objective
Coordinate the autonomous development team (@pm, @engineer, @qa, @devops) to translate user requirements into a fully deployed and verified application.

## Workflow Orchestration Sequence

```mermaid
graph TD
    User([User Request]) --> PM[@pm: Write Specs]
    PM --> Gate{User Approval Gate}
    Gate -- Approved --> ENG[@engineer: Generate Code]
    Gate -- Feedback --> PM
    ENG --> QA[@qa: Audit & Fix]
    QA --> DEV[@devops: Local Deployment]
    DEV --> End([Local URL & Verification])
```

---

## Steps

### 1. Specification Phase
*   **Agent:** `@pm`
*   **Instruction:** Read raw user prompt, create specification document, write to `production_artifacts/Technical_Specification.md`, and halt execution to ask the user for approval.

### 2. Code Generation Phase
*   **Agent:** `@engineer`
*   **Instruction:** Read `production_artifacts/Technical_Specification.md` and write codebase to `app_build/`.

### 3. Code Audit Phase
*   **Agent:** `@qa`
*   **Instruction:** Audit files in `app_build/` for quality, security, and dependencies. Fix issues directly on files.

### 4. Deployment Phase
*   **Agent:** `@devops`
*   **Instruction:** Navigate to `app_build/`, run `npm install` (or equivalent), host server locally, and report localhost URL.
