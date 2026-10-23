# Alto Andino

Our coffee app: the Coffee Shelf (coffees, bags, brews and ratings), Recent activity, My brews, Trends with Insights, a calculator, cupping, friends, and the "Bean to cup" chapters (notes from The World Atlas of Coffee). Plain HTML, CSS and JavaScript, no build step. The data lives in Supabase, shared per household; friends see only what a household shares.

Live at https://alto-andino.com (the old address birterot.github.io/alto-andino redirects there). Domain and DNS at Cloudflare, password emails through Resend (Supabase custom SMTP), hello@alto-andino.com forwarded by Cloudflare Email Routing.

## Structure

```
alto-andino/
  index.html                 Home: greeting, open bags, notes (caffeine, to rate, friends), shortcuts
  journal/index.html         the Coffee Shelf, Recent activity, My brews, the brew form, the household page
  trends/index.html          charts: over time, dial-in, freshness, taste, insights, household
  friends/index.html         friends: their shelves and recipes, trending, barista board, profiles, cups to rate
  calc/index.html            brew calculator
  cupping/index.html         cupping sessions (SCA scores)
  settings/index.html        settings, your data; settings/caffeine.html how caffeine is worked out
  feedback/index.html        feedback and wishes
  privacy.html               the privacy page
  chapters/                  Bean to cup: processing, roasting, freshness, devices, drinks
  data/                      content and defaults: chapters, devices, drinks, facts, defaults.js, world.js (map)
  supabase/                  SQL files, run in order in the Supabase SQL Editor; functions/notify (notifications)
  assets/css/                base.css (every page), chapter2.css (chapters)
  assets/js/                 shared parts: nav.js (top bar, menu, tabs, search), home.js, charts.js, caffeine.js,
                             people.js (colours), stars.js, scales.js, calcui.js, lists.js, chapter renderers
  sw.js                      service worker, only for notifications
```

## Preview locally

Double-click `index.html`, or run `python3 -m http.server 8000` in this folder and open http://localhost:8000.

## Edit content

Everything you read on a chapter page lives in `data/<chapter>.js`: methods, cup notes, facts, steps, glossary. The gauges on the processing page show the book's values (`G` in `data/processing.js`); your own tasting goes into your brews.

## Add a chapter

1. Add its content as `data/<chapter>.js` and its page as `chapters/<chapter>.html` (copy the closest existing pair).
2. Add it to `CHAPTERS` in `assets/js/nav.js` (menu, breadcrumbs, previous and next) and as a card in `chapters/index.html`.

## Publish

Push to `main`; GitHub Pages deploys from branch `main`, folder `/ (root)`. If a change needs a new SQL file, run it in Supabase first, then push.
