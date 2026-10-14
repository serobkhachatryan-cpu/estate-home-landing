# Oriel for UniWheel — static release bundle

**Release:** `1.0.0`  
**Target URL:** `https://www.uniwheel.co.uk/oriel/`  
**Delivery type:** self-contained static page — no build, server process, database, cookie banner, analytics script, Home Assistant connection, or secret is required.

## What to upload

Upload the **whole** `oriel/` folder from this bundle to the website document root so that the final server tree is:

```text
<web-root>/
└── oriel/
    ├── index.html
    └── assets/
        ├── oriel.css
        ├── oriel.js
        └── oriel-mark.svg
```

Do not rename `assets/` or upload only `index.html`: its CSS, JavaScript and icon use relative paths.

The authoritative Russian installation, verification and rollback runbook is [ADMIN-RELEASE-RU.md](ADMIN-RELEASE-RU.md).

## Boundaries of this public page

- It is a **public product page**, not the Oriel Home Assistant card itself.
- It deliberately contains no real estate measurements, screenshots, sensor/entity IDs, Home Assistant URL, access token, account data or live connection.
- The visual card is explicitly marked as illustrative. Values are intentionally unavailable in the demo.
- “Discuss a pilot” opens a `mailto:` link to the public UniWheel sales address; “Contact details” links to the existing UniWheel contact page. Confirm that those lead routes are desired before production release.

## Optional navigation link

After the page is live, add this to the existing UniWheel header on the pages where its main navigation is maintained:

```html
<a href="/oriel/">Oriel</a>
```

Place it between `About` and `Contact`; do not replace the shop or catalogue links.

## Scope of this release

The release is intentionally framework-free so it can be dropped into the currently observable static-style UniWheel site. It does not alter the homepage, catalogue, contact form, web server configuration or any Home Assistant deployment.
