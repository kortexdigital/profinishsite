# Pro Finish Coatings — website

Static one-page site for a painting contractor in Orlando / Central Florida.
No build step, no dependencies, no framework.

```
index.html
assets/css/style.css
assets/js/main.js
assets/img/*.webp
docs/HANDOFF.md
```

Deploys as-is to Vercel, Netlify, Cloudflare Pages, GitHub Pages or plain
cPanel. Point the host at the repo root — there is nothing to configure and
nothing to compile.

## ⚠ Not launch-ready yet

**The estimate form does not send anywhere.** It is fully built and
validated, but `ENDPOINT` in `assets/js/main.js` is still empty, so no lead
leaves the browser. That is the one blocker.

A handful of placeholders are still in place — email, address, the Google
rating, and the three testimonials. Every one is marked `data-placeholder`
in the markup.

**Read [`docs/HANDOFF.md`](docs/HANDOFF.md) before touching or deploying
this.** It covers the form integration, the full placeholder list, the
claims in the copy that need confirming with the client, and the design
rationale.

---
Built by [Kortex Labs](https://www.kortexlabs.tech).
