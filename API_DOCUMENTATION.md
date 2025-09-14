Got it 👍 — let’s extend the **Budget API requirements** to include not only the **endpoint contracts**, but also **what each API should _do_** under the hood: logic, acceptance criteria, guards, and edge cases. This will give you a **dev-ready requirements doc** that you (or your team) can implement.

---

# 📌 Budget API Requirements

## 1. **POST `/budgets`** — Create a budget

### What it should do

- Validate input:

  - `name` is required.
  - `period.startDate < period.endDate`.
  - `categories[]` contains no duplicate `categoryId`.
  - Each `categoryId` exists, belongs to the user, and `archived=false`.

- Auto-calculate:

  - `totalBudget = sum(allocatedAmount)`.

- Save new budget with `status="active"`.
- Return created budget.

### Acceptance Criteria

- ✅ `201` if valid.
- ❌ `400` if invalid period or bad input.
- ❌ `422` if duplicate categories.
- ❌ `400` if category invalid/archived.
- ❌ `401` if unauthenticated.

---

## 2. **GET `/budgets`** — List budgets

### What it should do

- Fetch all budgets for `req.user._id`.
- Apply filters:

  - `status=active|completed|cancelled`
  - `type=monthly|yearly|custom`

- Apply pagination (default: page=1, limit=10).
- Sort by `period.startDate` DESC.
- Return with metadata: total count, total pages.

### Acceptance Criteria

- ✅ `200` returns only user’s budgets.
- ✅ Filters applied correctly.
- ❌ `401` if unauthenticated.

---

## 3. **GET `/budgets/:id`** — Fetch one budget

### What it should do

- Find budget by `id` and `userId`.
- If not found → `404`.
- Return budget with calculated virtuals:

  - `totalSpent`
  - `remainingBudget`
  - `utilizationPercentage`
  - `budgetStatus`

### Acceptance Criteria

- ✅ `200` if found & owned.
- ❌ `404` if not found/not owned.
- ❌ `401` if unauthenticated.

---

## 4. **PATCH `/budgets/:id`** — Update a budget

### What it should do

- Fetch budget by `id` and `userId`.
- Validate updates:

  - Cannot add archived/unowned categories.
  - Period must remain valid (`start < end`).
  - No duplicate `categoryId`s in update.

- If categories changed → recalc `totalBudget`.
- Save changes.
- Return updated budget.

### Acceptance Criteria

- ✅ `200` on success.
- ❌ `400` invalid category or period.
- ❌ `422` duplicate categories.
- ❌ `404` not found/not owned.
- ❌ `401` if unauthenticated.

---

## 5. **DELETE `/budgets/:id`** — Cancel budget (soft delete)

### What it should do

- Fetch budget by `id` and `userId`.
- Set `status="cancelled"`.
- Save.
- Return `204 No Content`.

### Acceptance Criteria

- ✅ `204` success.
- ❌ `404` not found/not owned.
- ❌ `401` if unauthenticated.

---

## 6. **GET `/budgets/:id/analytics`** — Budget analytics

### What it should do

- Fetch budget by `id` and `userId`.
- Join with transactions:

  - Transactions must be within budget’s period.
  - Must match one of the budget’s categories.
  - Must be `status="completed"`.

- Build analytics:

  - Budget totals (totalBudget, totalSpent, remainingBudget, utilization%).
  - Per-category breakdown (allocated vs spent vs remaining).
  - Recent transactions.
  - Alerts if utilization > threshold.

### Acceptance Criteria

- ✅ `200` success with detailed breakdown.
- ❌ `404` not found/not owned.
- ❌ `401` if unauthenticated.

---

## 7. **POST `/budgets/:id/duplicate`** — Duplicate budget

### What it should do

- Fetch source budget by `id` and `userId`.
- Copy:

  - `categories` (with allocated amounts but reset `spentAmount=0`).
  - `currency`, `notifications`, etc.

- Apply new `name` and `period` from request.
- Save new budget.
- Return `201`.

### Acceptance Criteria

- ✅ `201` created successfully.
- ❌ `400` invalid period.
- ❌ `404` source budget not found/not owned.
- ❌ `401` if unauthenticated.

---

# 📌 Category API Dependencies

### Why Categories matter in Budgets

- Budgets only work if categories are valid.
- **Guards on Budget endpoints**:

  - Each `categoryId` must exist in `Category` collection.
  - Belong to same `userId`.
  - `archived=false` (cannot budget for archived categories).

- **Cross-feature rule**:

  - Transactions → Category → Budget
  - A transaction’s category determines which budget category `spentAmount` gets updated.

---

# 📌 Implementation Logic (Behind the Scenes)

- **On Transaction create/update/delete**:

  - Find all budgets where:

    - `period.startDate <= txn.date <= period.endDate`
    - `categories.categoryId` includes txn.categoryId
    - `status=active`

  - Call `budget.updateSpentAmounts()` for each.

- **Virtuals on Budget model**:

  - `totalSpent = sum(categories.spentAmount)`
  - `remainingBudget = totalBudget - totalSpent`
  - `utilizationPercentage = totalSpent / totalBudget * 100`
  - `budgetStatus` derived from thresholds (good, warning, critical, exceeded).

---

# 📌 Testing Plan

### Unit Tests

- Period validation.
- Duplicate categories.
- Category ownership/archived guard.
- Budget totals auto-update.
- Virtuals calculate correctly.

### Integration Tests

- `POST /budgets` → success, invalid period, duplicate categories.
- `GET /budgets` → filters by status/type.
- `PATCH /budgets/:id` → update name, update categories.
- `DELETE /budgets/:id` → soft delete.
- `GET /budgets/:id/analytics` → correct breakdown.

### Cross-feature

- Transaction created → updates budget.
- Archived category blocked in new budget.
- Cancelled budget ignored by transaction updates.

---

✅ This now covers:

- What each **Budget API** does,
- **Acceptance criteria + guards**,
- **Integration with Category & Transaction**,
- **Testing strategy**.

---

👉 Do you want me to also **combine this with your Transaction + Category docs** into a **single master requirements doc (with ERD diagram + OpenAPI YAML)** so you have the _whole Fin Tracker system_ in one place?
