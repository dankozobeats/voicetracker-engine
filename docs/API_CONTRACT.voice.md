# API CONTRACT — Voice Transactions (IMMUTABLE)

This document defines the dedicated API endpoint used to persist a voice-derived transaction payload.

## Endpoint

`POST /api/transactions/voice`

## Request

### Body

The request body is **exactly** the existing `TransactionCreateInput` produced by the voice pipeline.

Required fields:

```ts
{
  date: string;     // YYYY-MM-DD
  label: string;
  amount: number;   // must be > 0
  category: string;
  account: 'SG' | 'FLOA';
  type: 'INCOME' | 'EXPENSE';
}
```

No defaults are applied and no payload fields are auto-corrected.

## Responses

- `201 Created` — transaction persisted
- `400 Invalid payload` — strict validation failed
- `401 Unauthorized` — missing/invalid auth
- `500 Internal error` — database or unexpected error

## Notes

- No engine calls.
- No enrichment / transformation logic beyond validating and inserting the provided payload.
- Side effects are limited to the single database insert.

