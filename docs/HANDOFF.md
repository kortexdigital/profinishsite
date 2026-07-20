# Pro Finish Coatings — handoff

Static one-page site. No build step, no dependencies, no framework.
Open `index.html` or serve the folder — that's the whole deployment story.

```
site/
  index.html
  assets/css/style.css
  assets/js/main.js
  assets/img/*.png
  docs/HANDOFF.md
```

Deploys as-is to Vercel, Netlify, Cloudflare Pages, S3, or plain cPanel.
Drag the `site/` folder in. Nothing to configure.

---

## ⚠ Before this goes live

### 1. Wire up the form (required — no lead leaves the browser today)

The form is fully built and validated, but **nothing is sent anywhere yet**.
There is exactly one place to change. In `assets/js/main.js`:

```js
var ENDPOINT = ''; // ← paste the webhook URL here
```

Set it to a Make.com/Zapier webhook, a Formspree endpoint, or your own
API route. It POSTs JSON:

```json
{
  "property_type": "residential | commercial",
  "first_name": "…", "last_name": "…",
  "phone": "…", "zip": "…", "email": "…",
  "service": "…", "notes": "…",
  "submitted_at": "ISO-8601",
  "source": "profinishcoatings.com/#estimate",
  "fill_seconds": 0.8,
  "suspected_bot": false
}
```

`property_type` is the residential/commercial split — route on it.

**On `suspected_bot`:** it is a flag, never a filter. Anything submitted
in under 1.5 seconds gets marked, because that is unusually fast — but
browser autofill legitimately fills all six fields in one tap, so a fast
submit is more often a returning customer than a bot. Weigh it on your
end; **never drop a lead on it alone.** The one hard block is the
honeypot field, which is off-screen and `tabindex="-1"` — a person
cannot fill it, so those submissions are silently discarded and never
sent.

Until `ENDPOINT` is set, submissions are logged to the browser console and
the success message still shows — good for demoing, **not** for real traffic.
While it's empty, also add a matching `action`/`method` to the `<form>` and
delete the `<noscript>` block above it.

### 2. Replace every placeholder

Search `index.html` for `data-placeholder`. Each one is marked.

| What | Current value | Notes |
|---|---|---|
| Email | `estimates@profinishcoatings.com` | Footer |
| Address | "Orlando, Florida" | Also in the JSON-LD block in `<head>`. This is the physical address, not the service area — the copy positions the company as Central Florida, but structured data needs a real city. |
| "4.9 ★ Google rating" | invented | Hero stats |
| Domain | `profinishcoatings.com` | `canonical`, `og:url`, `og:image` |

The phone number is real: **(407) 887-7011**, live in the header, hero,
footer, mobile bar, `noscript` fallback and JSON-LD. `main.js` does not
hardcode it — its error message reads it out of the header, so it follows
any future change automatically.

### 3. Delete or replace the testimonials — do not ship them as-is

The three quotes in `#reviews` are **written examples**, not real customers.
Publishing invented reviews is a legal and trust problem — and a common one:
competitor sites in this trade routinely ship placeholder testimonials to
production without noticing.

Either paste in real, attributable Google reviews, or delete the whole
`<section id="reviews">` block. The page reads fine without it.

### 4. Check the claims are true

The copy makes specific, checkable promises. Confirm each one with the client
before launch, and change anything they can't actually deliver:

- Two coats written into every estimate
- Fixed written price, good for 30 days
- No deposit required to book
- Response within one business hour
- Walkthrough scheduled within 48 hours
- Written estimate within 24 hours of the walkthrough
- 2-year workmanship warranty
- Licensed and insured in Florida
- Sherwin-Williams / Benjamin Moore products
- Price ranges quoted in the FAQ ($3,500–6,500 interior, $4,000–8,000 exterior)

A promise on the site the crew doesn't keep costs more than no promise.

---

## Already done — don't redo these

**Images are optimized.** All eight were generated as PNGs (16.9 MB total),
then resized to their real display widths and converted to WebP at q82:
**920 KB total, 95% smaller.** The full-resolution originals are archived in
`_src-png/` at the project root — outside `site/`, so they never deploy.
Re-crop or regenerate from those, not from the WebPs.

**Reviewed and fixed.** The build went through an adversarial review pass;
these were found and corrected, and each fix is verified by an automated
check (see below):

- The spam time-trap was silently discarding autofilled leads *while showing
  the success message*. Now a flag, not a filter.
- `.reveal`'s `clip-path` hid every heading on the page if JS failed to load.
  Now gated behind a `.js` class that only JS can add.
- `.fear` and `.rules` exposed hollow grid cells at some widths. Both are now
  pinned to counts that divide their item count evenly, at every breakpoint.
- Anchor links landed section tops underneath the sticky header.
- Form inputs had their focus ring removed; contrast failures on
  `--amber-dp` and `--muted-2` against light surfaces.
- Validation rejected one-letter first names while accepting `12` and
  15-digit phone numbers.
- No `og:image`, `canonical` or favicon — every shared link rendered as a
  bare text card.
- 320px horizontal overflow, masked by `overflow-x:hidden`.

**Verification scripts** live in the session scratchpad, not the repo. The
checks that matter: 15 functional assertions on the form (validation, ARIA
wiring, honeypot, payload contents, slider), plus measured sweeps for grid
hollow-cells, horizontal overflow and anchor clearance across 9 viewport
widths from 1440px to 320px. Re-run them after any structural change.

---

## Design notes

**Thesis: "the cut line."** A painter's craft comes down to the edge where
wall meets trim — and the company is literally named for the finish. So the
page is built entirely from hard edges: zero border-radius anywhere, colour
fields that meet on a straight line, and a 4px amber rule marking every
boundary. The before/after handle is that same cut line.

**Palette** — ink `#111111`, warm off-white `#F6F4F0`, amber `#E8871E`.
The amber is deliberately scarce: CTAs, the guarantee field, and the cut.
Nothing decorative is amber. Both competitor sites are blue; so is most of
the trade. This isn't.

**Type** — Archivo at width 125% (expanded) for display, IBM Plex Sans for
body, IBM Plex Mono for every micro-label. The mono isn't styling: paint cans
and spec sheets are technical documents, so sheens, coats, timelines and
warranty terms are set in the register they actually live in.

**Motion** — one device only. Section titles reveal with a left-to-right wipe,
like a roller pass. Everything respects `prefers-reduced-motion`.

**Field rhythm** — ink → amber → warm → white → warm → ink → white → amber →
ink → warm → white → ink. Amber gets two full fields (the trust strip and the
guarantee) and nothing else.

## Accessibility floor

Skip link, visible focus rings on every interactive element, keyboard-operable
before/after slider, `aria-live` form status, real `<label>` on every field,
alt text on every image. The FAQ uses native `<details>` — it works with JS
disabled.

---

Competitive research and the design rationale behind specific choices are kept
in the agency's internal notes, not in this repository.
