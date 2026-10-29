# Chat API

The demo endpoint is same-origin `POST /api/chat`; it is not a public B2B API or an SDK. All state is supplied by the client. The schemas in [`web/lib/schema.ts`](../web/lib/schema.ts) are authoritative.

## Request example

This offline request selects the `price-cyclo` canned sample. Times are ISO 8601 with an offset and prices in cards use thousands of Vietnamese dong.

```json
{
  "input": { "kind": "sample", "sample_id": "price-cyclo" },
  "history": [],
  "state": {
    "lang": "en",
    "location": { "lat": 10.7724, "lng": 106.698, "label": "Bến Thành (demo)", "source": "picked" },
    "now": "2026-10-30T05:05:00.000Z",
    "offline": true
  },
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

`input.kind` accepts `text`, `sample`, `quick`, `image`, `sim`, `group_vote`, `story`, `edit_plan` or `context_reply`. Their fields and allowed values are in the schema. Text is at most 500 characters; history is an array of at most ten `{ role, text }` entries. State includes `lang` (`en` or `vi`), location (`lat`, `lng`, `label`, `source`), `now` and `offline`; it can also include `itinerary` and `budget_cap`. Images use `media_type` and base64 `data_b64` and are limited to 4 MiB decoded. `session_id` is optional; an invalid UUID is replaced before a provider call.

## Response example

The following is the current `price-cyclo` canned result, with fields retained by the response schema. Data may change when the CSV is updated.

```json
{
  "reply_text": "For a one-hour cyclo ride, 300k is a bit high against this reference.",
  "blocks": [{
    "type": "price_check",
    "item": "xích lô",
    "reference_min": 150,
    "reference_max": 250,
    "user_price": 300,
    "verdict": "a_bit_high",
    "tip": "Agree on the price and duration before boarding.",
    "source": "https://amazing-vietnam.net/plan-your-trip/transportation/local-transport-in-vietnam/",
    "checked_at": "2026-10-30"
  }],
  "quick_replies": ["Nearby", "Plan my day"],
  "simulated": false,
  "fallback": true,
  "source": "canned"
}
```

`source` is `agent`, `rules` or `canned`. Agent replies can include `meta` with provider, model and key mode; it never contains the key. `fallback` identifies a canned fallback and `simulated` marks a simulated request.

| Block `type` | Contents |
| --- | --- |
| `text` | Text |
| `place_cards` | Places, location, opening status, price, map URL and source |
| `itinerary` | Dates, stops, estimated legs, total and optional budget |
| `tiktok_result` | Video metadata, extraction status and optional matched place |
| `menu_translation` | Translated items, tags, prices and ordering phrases |
| `price_check` | Price reference, verdict, tip, source and checked date |
| `context_prompt` | A question and response options |
| `story` | Place story, detail to look for and source |
| `replan` | Reason and before, after and dropped stops |
| `group_vote` | Members, votes and resulting place IDs |
| `budget` | Spent, planned, cap, warning and cheaper options |

## Errors and health

Malformed JSON and invalid schema return HTTP 400; a mismatched `Origin` returns 403; an image over 4 MiB returns 413. Provider errors and timeouts normally return a successful fallback reply rather than exposing provider details. Unexpected server errors can return HTTP 500.

`GET /api/health` returns `{ "ok": true, "ai": "on" | "off", "model": "..." }`; `ai` indicates whether AI is enabled and a key is present, not a live provider connectivity check. See [architecture](architecture.md) for routing and limits.
