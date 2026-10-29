# Architecture

Ask Saigon is a Next.js application with a browser client and a single chat route. The browser holds the last ten text history entries, the current location, itinerary and budget; a reload starts a new conversation. It generates a session UUID and sends state with each request. No account or persistent conversation store is implemented.

## Request lifecycle

1. The client sends an input, history, state and optional session ID to [`POST /api/chat`](api.md). Sample menus are selected by ID; uploaded images are resized in the browser and sent as base64.
2. The route checks same-origin requests when an `Origin` header is present, parses the request with Zod, rejects images over 4 MiB and passes the request and IP to the router.
3. The router selects deterministic local rules, canned output or the agent. A `Reply` contains text, typed blocks, quick replies and source flags. The route validates the reply before returning it; the client renders recognized block types and ignores unknown ones.
4. The client keeps returned itinerary state and sends it back on later requests. Context prompts for meal windows are generated in the browser while the page is open.

## Routing

| Input | Path |
| --- | --- |
| `sim`, `group_vote`, `story`, `edit_plan`, `context_reply` | Local rules and tools |
| `sample`, `quick`, `text`, `image` with AI enabled, key present and quota available | Agent; a sample without its expected card falls back to its canned answer |
| `sample` in offline mode, with AI disabled, or on agent failure | Canned answer |
| `quick` without AI | Local place search or itinerary tool, with a sample itinerary if no stops can be scheduled |
| Other text or image without AI | Offline message with sample prompts |

`?offline=1` persists in browser session storage and is sent as `state.offline`. It prevents agent calls but still requires the app server. Simulated replies carry `simulated: true`; canned replies carry `fallback: true` and are labelled cached. The current seed has unverified hours and prices left empty, so a generated plan or simulated replan can have no viable stops; the UI explains empty plans and the canned plan is explicitly illustrative.

## Agent and tools

The agent uses the OpenAI-compatible Chat Completions adapter, with `LLM_BASE_URL` and `LLM_MODEL` configurable on the server. It sends a UUID in `x-opencode-session`, uses at most four provider rounds and a shared deadline (`AGENT_TIMEOUT_MS`, default 25 seconds). Provider errors, refusal, timeout and unavailable quota fall back through the router; sample outputs are checked for their expected block type. The route's maximum duration is 60 seconds.

Tool definitions validate their arguments with Zod. The tools are `search_places`, `check_place_live`, `read_tiktok`, `get_price_reference`, `plan_itinerary`, `get_story`, and `show_menu_translation`. Place checks match the local dataset rather than a live Google Places API. TikTok reading accepts HTTPS TikTok hosts, bounds redirects and time, tries oEmbed and then limited public-page metadata; the model must still identify a name and match it against local records. Tool results, not free-form model JSON, are used to construct cards; image translation is submitted through its structured tool schema.

## Local rules

The rules implement rain and 40-minute delay replans, deterministic group votes, a near-budget alert and the meal-time prompt. Place and itinerary tools use the local CSV-derived data, Vietnam-time hours and distance estimates; travel times are estimates. The browser accepts or keeps a replan and can open a stop's local place card. These simulations are demonstrations, not live sensing or a group messaging service.

## Security and limits

The provider key is server-only. The chat route does not enable CORS, rejects a mismatched `Origin`, limits text to 500 characters, history to ten entries and decoded images to 4 MiB. The provider session ID is validated as a UUID or replaced server-side. Logs record input kind, response source and elapsed time, not the chat text, image or key. External TikTok fetches are restricted to TikTok hosts; map directions are links opened by the browser.

The AI limiter permits 15 requests per IP per ten minutes and defaults to a daily cap of 300. **Both counters are in memory per server process**, not a durable global or distributed quota; instances and restarts have separate counters. `AI_MODE=off` disables agent calls. See [security reporting](../SECURITY.md) and [data sourcing](data.md).
