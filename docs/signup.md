# Signup contract and FT-003 review

POST `/fin-tracker/v1/auth/signup` is public. Accepted fields are `name`, `email`, `userName`, and `password`, all strings. Name/email/username are trimmed; email is lowercased. Password is not trimmed. Unknown fields, including role, ownership, IDs, tokens and timestamps, return `400` without creating an account or sending email.

The current request key is **userName**. The requirements use the product term username; `username` is not currently accepted as an API alias. Retain `userName` for existing clients; a future rename needs an explicit compatibility story.

Successful registration returns `201` with `{dateTime, data: {id, name, email, userName, role}}`. Role is assigned as `user` by the server. Password hashing runs through the User model save hook. Credential/internal fields are not included in the response.

## Client migration

- Remove `role` and other internal fields from signup requests, even when role was `user`.
- Expect `201`, replacing the old `200` expectation.
- Read the new account identifier from `data.id`, replacing `data._id`.
- Do not depend on previously exposed model metadata such as refresh state or createdAt.

## Verification

Run `npm ci`, then:

```sh
npm test -- --runTestsByPath __tests__/signup.integration.test.js --runInBand
```

The suite starts a disposable MongoDB process, mocks the exact email module used by the controller, and verifies HTTP and persisted state. The first run may download a MongoDB binary. Each test resets the local test client's actual limiter counters; production limit configuration is unchanged. Limiter behavior itself belongs to FT-037.

Coverage: regular-user role, correct password hash, exact safe response, protected/unknown fields, absent/empty/array/null/string bodies, missing password, wrong field type, normalization and no write/email side effects on rejection.

Legacy signup fixture expectations are updated, but their shared-database/provider harness remains FT-001 work. Do not run those suites against a valuable database. No claim is made here that the full legacy suite passes.

## Scope boundaries

FT-003 secures the field boundary. Normalized identity uniqueness/concurrent duplicate handling (FT-009), complete shared password policy (FT-010), and durable email delivery (FT-014) remain separate. Currently SMTP failure can still fail the response after account creation. This is not a declaration that all registration behavior is release-ready.
