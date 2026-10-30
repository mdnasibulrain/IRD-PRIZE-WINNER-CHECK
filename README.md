# IRD Prize Winner Checker (starter deployment)

This project reads the publicly exposed IRD winner endpoint and checks 12-digit coupon numbers. It does **not** claim to be an official IRD service.

## Important data limitation
The public IRD endpoint currently returns draw metadata and winning coupon numbers, but does not return winner names or payer mobile numbers. Therefore name-only and mobile-only matching cannot truthfully be implemented from that endpoint. The UI keeps those options visible and explains the missing verified data source instead of inventing a result.

A documented CellPay partner API provides a mobile-number coupon lookup, but it requires a CellPay Access Token and partner access. It is not an unrestricted public API. Do not put that token in `index.html`; add a server-side integration only after receiving valid credentials and confirming the allowed use. Name lookup still requires a trusted name-to-coupon mapping source.

## Deploy with Cloudflare Pages + Worker

1. Create a GitHub repository and upload `index.html`, `worker.js`, and `wrangler.toml`.
2. In Cloudflare, create a Worker named `ird-prize-checker` and deploy `worker.js` (or use Wrangler from a computer).
3. The Worker URL exposes `/api/winners` and `/api/health`.
4. Deploy `index.html` to Cloudflare Pages. Configure a Pages Function or Worker route so `/api/*` on the Pages domain reaches the Worker. Easiest for a first test: edit `index.html` and replace `fetch('/api/winners')` with `fetch('https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev/api/winners')`.
5. Open the Pages site and test a coupon number that appears in the current IRD public result list.

## Endpoints
- `GET /api/health` — health check
- `GET /api/winners` — all publicly available winner coupon records, normalized for the UI

## Limitations and safety
- A coupon not found in the fetched public list means only “not found in the currently published data”; it is not proof that the person is not a winner.
- Always verify a winning record at https://prize.ird.gov.np/ before making a claim.
- Do not collect or publish people's names, phone numbers, bills, or other personal data without a lawful basis and appropriate safeguards.
