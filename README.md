![2028 Games Unofficial Session Guide screenshot](screenshot.png)

> **Disclaimer:** This is an unofficial, open-source project and is not affiliated with, endorsed by, or connected to any official games organizing body. Session data is scraped from publicly available schedules and materials and may be inaccurate, incomplete, or outdated. Always verify details against official sources before making any plans or purchasing decisions. Use at your own risk.

# 2028 Games Unofficial Session Guide

[![CI](https://github.com/tomparkp/2028-games-guide/actions/workflows/ci.yml/badge.svg)](https://github.com/tomparkp/2028-games-guide/actions/workflows/ci.yml)

After being selected for the 2028 Summer Games local presale, I found myself overwhelmed with the options. 800+ sessions! 40+ venues!

I vibe-coded a better session browser, but I still needed help deciding where to allocate my precious 12 slots. I had Claude come up with a multidimensional system to rank the events (see [AI Ratings Methodology](#ai-ratings-methodology)) and then populate them with easy-to-understand summaries/rating explanations.

This ended up being hugely helpful for me when buying tickets, so I hope it helps you too!

## Resources Used

- [2028 Session Table](https://docs.google.com/spreadsheets/d/1bJJc__Bt_VgBkZw3jZAMHKmoP3Q5Wdq5I9sA4vzLsws/htmlview?gid=798256147&pru=AAABnY8tXA0*s67VGSR_thwjEPBNJ8734g#gid=798256147) (Google Sheets) — primary source of session data.
- [Official competition schedule](https://la28.org/content/dam/latwentyeight/competition-schedule-imagery/uploaded-nov-12-2025/LA28OlympicGamesCompetitionScheduleByEventV2.pdf) (PDF) — used to cross-reference and verify session data against the officially published schedule.

## Special Thanks

- [u/type*rex*](https://www.reddit.com/r/olympics/comments/1sc3a21/la28_google_doc_session_codes_current_prices_and/) — for the session table Google Sheet.
- [u/polygon06](https://www.reddit.com/r/olympics/comments/1scjk1s/interactive_la28_schedule_explorer/) — whose schedule explorer inspired me to share this project.

## AI Ratings Methodology

Sessions are scored by an AI pipeline (`pnpm generate-content`) that grounds each session in up-to-date facts, writes a blurb, then produces a scorecard across five dimensions. The methodology is opinionated: it is meant to surface interesting sessions, not to be official or authoritative. **Ticket price is not part of the rating**; it stays in the table so you can judge value yourself. Sessions that haven't been scored yet still appear in the schedule but don't display a scorecard.

### Dimensions and weights

Every dimension is scored on a 1–10 scale. The **aggregate** is a weighted average of the five (shown in the UI to one decimal place).

| Dimension        | Weight | What it reflects                                                                                                                 |
| ---------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Significance** | 30%    | How much the session matters in context: round type (e.g. gold medal vs preliminary), sport stakes, multi-medal sessions.        |
| **Experience**   | 25%    | How strong the live-watch experience is likely to be: sport watchability, venue, round importance, prime-time slotting.          |
| **Star power**   | 15%    | Likelihood of globally recognized athletes competing in this session.                                                            |
| **Uniqueness**   | 15%    | Rarity of the opportunity: new/returning sports, iconic venue pairings, ceremonies.                                              |
| **Demand**       | 15%    | How hot tickets are likely to be: sport-level demand, round, price ceiling as a signal, standout "cultural moment" combinations. |

## Performance

Every pull request runs [Lighthouse CI](lighthouserc.json) against the production build on a throttled mobile profile, and the check fails if any page misses its budget. In production, [Vercel Speed Insights](https://vercel.com/docs/speed-insights) records real-user Core Web Vitals.

| Page                                | Performance | Accessibility | Best Practices | SEO | LCP   | CLS | TBT   |
| ----------------------------------- | ----------- | ------------- | -------------- | --- | ----- | --- | ----- |
| Home `/`                            | 100         | 100           | 100            | 100 | 1.4 s | 0   | 0 ms  |
| Session deep link `/?session=ATH15` | 94          | 100           | 100            | 100 | 3.0 s | 0   | 20 ms |
| Privacy `/privacy`                  | 100         | 100           | 100            | 100 | 0.8 s | 0   | 0 ms  |

_Median of 3 Lighthouse 12.6 mobile runs (simulated slow 4G, 4× CPU slowdown), October 2026._

**Budgets:** accessibility, best practices, and SEO must score 100 on every page, with CLS ≤ 0.1 and TBT ≤ 200 ms. Home and static pages also need performance ≥ 95 and LCP ≤ 2.5 s. Session deep links are the slowest page because the session drawer mounts after hydration, so their budget is performance ≥ 85 and LCP ≤ 4 s.

**What keeps it fast:**

- Every URL is server-rendered and cached at the CDN (`s-maxage` 1 hour, `stale-while-revalidate` 1 day). Static pages are prerendered.
- Session data is bundled into the server function, so there's no database round trip, and the client only fetches the rows or the single session it shows.
- The document preloads route code, so there's no request waterfall, and an inline script applies the saved theme before first paint.
- Hashed assets are cached immutably for a year.
- Client-only state (saved sessions in `localStorage`) loads after hydration, so React never throws away the server HTML.
- Theme colors meet WCAG AA contrast (4.5:1) in both light and dark mode.

Run it locally with `pnpm build && pnpm lighthouse`. HTML reports are written to `.lighthouseci/reports`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE)
