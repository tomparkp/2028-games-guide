// Turns Lighthouse CI results into shields.io endpoint badges for the README.
// Picks the median run by performance score, so every badge and the linked
// report come from the same run, and writes one `<name>.json` per badge plus
// that run's full report as `report.json`.
//
// Usage: node scripts/lighthouse-badges.mjs [resultsDir] [outDir]
//        (defaults: .lighthouseci, badges)
import { mkdirSync, readdirSync, readFileSync, appendFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [resultsDir = '.lighthouseci', outDir = 'badges'] = process.argv.slice(2)

const runs = readdirSync(resultsDir)
  .filter((file) => /^lhr-.*\.json$/.test(file))
  .map((file) => JSON.parse(readFileSync(join(resultsDir, file), 'utf8')))

if (runs.length === 0) {
  console.error(`No Lighthouse results (lhr-*.json) found in ${resultsDir}`)
  process.exit(1)
}

runs.sort((a, b) => (a.categories.performance.score ?? 0) - (b.categories.performance.score ?? 0))
const lhr = runs[Math.floor(runs.length / 2)]

// Lighthouse's own score bands: 90+ good, 50–89 needs improvement, below 50 poor.
function scoreColor(score) {
  if (score >= 0.9) return 'brightgreen'
  if (score >= 0.5) return 'orange'
  return 'red'
}

// Core Web Vitals "good" / "needs improvement" thresholds.
function metricColor(value, good, poor) {
  if (value <= good) return 'brightgreen'
  if (value <= poor) return 'orange'
  return 'red'
}

const badges = {}

for (const [id, label] of [
  ['performance', 'performance'],
  ['accessibility', 'accessibility'],
  ['best-practices', 'best practices'],
  ['seo', 'seo'],
]) {
  // A category that fails to run has a null score.
  const score = lhr.categories[id]?.score ?? null
  badges[id] =
    score === null
      ? { label, message: 'error', color: 'lightgrey' }
      : { label, message: String(Math.round(score * 100)), color: scoreColor(score) }
}

const lcp = lhr.audits['largest-contentful-paint'].numericValue
const cls = lhr.audits['cumulative-layout-shift'].numericValue
const tbt = lhr.audits['total-blocking-time'].numericValue

badges.lcp = {
  label: 'LCP',
  message: `${(lcp / 1000).toFixed(1)} s`,
  color: metricColor(lcp, 2500, 4000),
}
badges.cls = {
  label: 'CLS',
  message: String(Number(cls.toFixed(3))),
  color: metricColor(cls, 0.1, 0.25),
}
badges.tbt = {
  label: 'TBT',
  message: `${Math.round(tbt)} ms`,
  color: metricColor(tbt, 200, 600),
}

mkdirSync(outDir, { recursive: true })
for (const [name, badge] of Object.entries(badges)) {
  writeFileSync(join(outDir, `${name}.json`), JSON.stringify({ schemaVersion: 1, ...badge }) + '\n')
}
writeFileSync(join(outDir, 'report.json'), JSON.stringify(lhr))

const summary = [
  `Lighthouse ${lhr.lighthouseVersion} · ${lhr.finalDisplayedUrl} · median of ${runs.length} runs`,
  '',
  '| Metric | Value |',
  '| --- | --- |',
  ...Object.values(badges).map(({ label, message }) => `| ${label} | ${message} |`),
].join('\n')

console.log(summary)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n')
