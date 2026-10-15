# Frontend Regression Tests

Run `npm test` from `frontend` with Node.js 22.18+ or 24+.
The tests use Node's built-in TypeScript support and test runner. They mock
fetch and localStorage, so no API server, database, or credentials are needed.

The suite covers shared token refresh, delayed unauthorized responses,
request retries, session changes during refresh, token subscriptions,
temporary failures, malformed responses, and empty successful responses.
