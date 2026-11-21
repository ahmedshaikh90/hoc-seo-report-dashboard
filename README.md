# hoc-seo-report-dashboard
HOC Furniture SEO Performance Dashboard – Track Google Search Console, keyword rankings, organic traffic, backlinks, SEO team performance, and monthly historical reports with interactive analytics.

## Monthly evidence archive

- `data/monthly/index.json` lists the dated snapshots available in **Audit evidence**.
- `data/monthly/YYYY-MM/team-original.json` preserves the original workbook import by source sheet and row.
- `data/link-audits/` preserves dated URL observations, reported status, historical notes, redirects and direct HOC anchors.
- `data/keyword-audits/` preserves dated Search Console comparisons and their search windows.

The November 2026 import contains 429 rows with 336 distinct report URLs. The previously published management report contains 427 rows. In several categories the workbook import gives a platform homepage while the management report identifies a placement. The audit preserves both URL variants and labels the source of each observation. Two Tumblr rows were absent from the previous dashboard data.

A reachable platform homepage is insufficient evidence for a placement. A finding is marked Verified Live when the placement is identifiable, with a direct HOC link required for guest posts. HTTP 404, HTTP 410 and a placement resolving to a generic homepage or missing-page screen are evidence of a broken placement. Access errors and ambiguous results preserve the team's reported Live or Indexed claim where supplied. HTTP availability and Google index status are different measurements.

For subsequent audits, add new dated files and prepend a catalog entry. Do not overwrite prior snapshots. Search Console movements use comparable date windows and average position when both observations exist. Missing referral session or lead measurements are recorded as null. Exact article attribution requires a full referrer URL or a uniquely tagged campaign, plus configured lead events.
