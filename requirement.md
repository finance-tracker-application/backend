Perfect 👍 — thanks for the structured spec for **Category**. I’ll mirror that style for your **Budget** module, keeping in mind your updated `Budget` schema (with `categoryId` references, transactions, etc.).

Here’s a **Budget — Requirements + API Contract + Testing Plan** spec, similar to what you wrote for Category:

---

# Budget — Requirements

## Functional

- A Budget is **user-scoped** and aggregates planned vs. spent amounts across categories.

- Fields:

  - `_id`
  - `userId` (owner)
  - `name` (string, required)
  - `type` ("monthly" | "yearly" | "custom")
  - `period: { startDate, endDate }` (required)
  - `categories[]`:

    - `categoryId` (ref → Category, must exist, not archived, must belong to user)
    - `allocatedAmount` (number, ≥0, required)
    - `spentAmount` (number, default 0, system-updated from Transactions)
    - `color?`

  - `totalBudget` (auto-calculated from `allocatedAmount`s)
  - `currency` (default "USD", enum limited set)
  - `status` ("active" | "completed" | "cancelled")
  - `notifications` (enabled, threshold %, email/push)
  - `tags?`, `notes?`
  - timestamps

- **Uniqueness:** name does not need to be unique globally, but recommend per-user uniqueness within overlapping date ranges (to prevent confusion).

- **Lifecycle:**

  - Status updates: automatically mark `completed` if period has ended.
  - Soft delete via `status="cancelled"`.

- **Guards:**

  - `endDate > startDate` (enforced in schema).
  - Category references must be:

    1. owned by user,
    2. non-archived,
    3. no duplicates within one budget.

  - Transactions only update `spentAmount` if inside the budget’s date range and category matches.

- **Ownership:** Users can only access their own budgets.

## Non-Functional

- **Auth:** JWT required for all routes.
- **Rate limiting:** reuse service-wide defaults; stricter for POST/PATCH/DELETE.
- **Validation errors:** same error envelope as categories:

```json
{
  "dateTime": "ISO",
  "status": "Fail",
  "message": "Human readable",
  "details": { "field": "msg" }
}
```

- **Indexing:**

  - `userId + period.startDate` for query performance.
  - `userId + status` for dashboards.

---

# API Endpoints & Acceptance Criteria

## POST `/fin-tracker/v1/budgets`

Create a new budget.

**Body**

```json
{
  "name": "September Expenses",
  "type": "monthly",
  "period": { "startDate": "2025-09-01", "endDate": "2025-09-30" },
  "categories": [
    { "categoryId": "64f9c8d2b6a1a5e3c8d9a123", "allocatedAmount": 500 },
    { "categoryId": "64f9c8d2b6a1a5e3c8d9a456", "allocatedAmount": 200 }
  ],
  "currency": "USD",
  "notes": "Budget for September"
}
```

**Success**

- `201` with created budget (system calculates `totalBudget`).

**Acceptance**

- `422` if duplicate `categoryId` in categories array.
- `400` if invalid period (end ≤ start).
- `400` if referenced category does not exist / not owned / archived.
- `401` if unauthenticated.

---

## GET `/fin-tracker/v1/budgets?status=active&type=monthly`

List user’s budgets.

**Success**

- `200` with `{ data: Budget[] }`, sorted by `period.startDate` DESC.

**Filters**

- `status=active|completed|cancelled` (optional).
- `type=monthly|yearly|custom`.

---

## GET `/fin-tracker/v1/budgets/:id`

Fetch a single budget.

**Acceptance**

- `200` if found & owned.
- `404` if not found or not owned.
- Response includes calculated fields (`totalSpent`, `remainingBudget`, `utilizationPercentage`, `budgetStatus`).

---

## PATCH `/fin-tracker/v1/budgets/:id`

Update name, categories, period, status, notifications, notes.

**Body (examples)**

```json
{ "name": "Q4 Budget" }
```

```json
{ "status": "completed" }
```

**Acceptance**

- `200` on success.
- `400` invalid period or duplicate categories.
- `400` if modifying categories to include archived/unowned ones.
- `404` if not found or not owned.

---

## DELETE `/fin-tracker/v1/budgets/:id` (optional)

Soft delete (set `status="cancelled"`).

**Acceptance**

- `204` on success.
- `404` if not found/not owned.

---

# Integration Contracts

- **Transactions impact budgets**:

  - When a transaction is created/updated:

    - Must update all active budgets that cover the transaction’s date range and category.

  - Only expense transactions reduce category allocations.

- **Category archived guard**:

  - Cannot add archived categories to new budgets.
  - If a category is later archived, existing budget remains valid but won’t accept new txns.

---

# Testing Plan (Jest + Supertest + Mongoose)

## Unit tests (model & validation)

1. **Period validity**

   - Start ≥ end → fail.
   - Valid start/end → ok.

2. **Duplicate categoryIds**

   - `[catA, catA]` → error.

3. **Total budget auto-calculated**

   - Sum(allocatedAmount) updates `totalBudget`.

4. **Category guards**

   - Archived category → reject.
   - Wrong user’s category → reject.

5. **Virtuals**

   - `totalSpent`, `remainingBudget`, `utilizationPercentage`, `budgetStatus` calculate correctly.

---

## Integration tests (routes)

### POST /budgets

- ✅ `201` create valid budget.
- ✅ `422` duplicate categoryIds.
- ✅ `400` invalid date.
- ✅ `400` invalid category.
- ✅ `401` no token.

### GET /budgets

- ✅ lists only user’s budgets.
- ✅ filters by type/status.
- ✅ includes calculated fields.

### GET /budgets/\:id

- ✅ own budget → `200`.
- ✅ other user’s budget → `404`.

### PATCH /budgets/\:id

- ✅ rename works.
- ✅ update categories works if valid.
- ✅ archive category added → `400`.
- ✅ mark completed → `200`.

### DELETE /budgets/\:id

- ✅ marks status = cancelled.
- ✅ subsequent GET returns `status: cancelled`.

---

## Cross-feature tests

**Transactions**

- Adding expense txn updates budget’s `spentAmount`.
- Adding txn outside budget period → no update.
- Adding txn with income type → no update.
- Deleting transaction → reduces spentAmount accordingly.

**Categories**

- Archiving category prevents it from being added to new budgets.
- Existing budgets with archived category still load but cannot be updated with that category.

---

# Controller Stubs

```js
// routes/budget-routes.js
router.post("/", auth, createBudget);
router.get("/", auth, listBudgets);
router.get("/:id", auth, getBudget);
router.patch("/:id", auth, updateBudget);
router.delete("/:id", auth, cancelBudget); // soft delete

// controllers/budgetController.js
export const createBudget = async (req, res, next) => {
  /* 201 / 400 / 422 */
};
export const listBudgets = async (req, res, next) => {
  /* 200 */
};
export const getBudget = async (req, res, next) => {
  /* 200 / 404 */
};
export const updateBudget = async (req, res, next) => {
  /* 200 / 400 / 422 */
};
export const cancelBudget = async (req, res, next) => {
  /* 204 / 404 */
};
```

---

👉 Do you want me to extend this into an **OpenAPI 3.0 YAML snippet** (like a Swagger spec) so you can plug it directly into Scalar/Spotlight for documentation?
