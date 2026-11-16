# Changelog

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and uses semantic versioning.

## [0.2.0] - 2026-11-17

### Added

- Source labels (official, business-declared, personal experience, reference) and extra source lines on every place and price, with Department of Tourism (visithcmc.vn) sources for 20 places.
- Routes: seed routes, route suggestions in chat, follow a route, star ratings, posting with review; green-travel label.
- Contribution portal, review queue, Report button, and anonymous demand stats per channel (Upstash Redis).
- Partner chat box (`/embed`, `public/widget.js`) with a demo tour company site and a demo hotel guest app.
- Public data API `/api/v1` (places, prices, routes, itinerary) with CORS.
- Rain forecast from Open-Meteo in the day plan.

### Changed

- Questions decided by the data are answered without the model; the agent stops after a tool round that produced cards. Typical answers dropped from 5–10 s to under a second, a menu photo from about 17 s to 9 s.
- Live AI is limited per browser instead of per IP.

### Fixed

- "Quận 1" and "an toàn" were read as food questions; a capital Đ did not match place names; questions naming a place got "not in our data" from the model.

## [0.1.0] - 2026-10-30

### Added

- Mobile-first Ask Saigon landing, chat and business-roadmap pages with English and Vietnamese UI labels.
- Structured place, TikTok, menu, price and itinerary cards, local simulations and sample media.
- A validated local data pipeline, offline canned and rules routes, and an optional OpenAI-compatible agent.
- Unit and mobile end-to-end tests, documentation and CI.

### Limitations

- Demo coverage is restricted to District 1 and District 3; the current seed is provisional and unverified fields remain blank.
- Sample TikTok results and the fallback itinerary are illustrative. Simulations use local rules, and business features are roadmap concepts.
