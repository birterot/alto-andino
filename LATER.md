# Later

Ideas for after the basics have settled. Nothing here is promised; it is the list we pick from.

## Caffeine
- **Caffeine per day and per week** as a chart in Trends.
- **Apple Health:** a home-screen web app cannot write to Apple Health directly. Options: a native iPhone app later, or an Apple Shortcut that the app opens after a brew and that logs the caffeine to Health.

## Brewing and the book
- Matching similar recipes automatically (with a tolerance for grind and pressure).
- Cup card with our latest tastings per processing method.
- Chapters still to write: tasting and extraction ("coming soon" on Bean to cup), how to dial in a coffee.

## Social: a coffee feed with friends
- **Post a brew:** after a brew, post it with a photo, and friends can comment on it (and react). More interactive than the stats and shelves friends see now.
- **Kept a bit separate** from the journal: how it fits into the app is still open (its own tab or page, rather than mixed into the Coffee Shelf and Recent activity).
- To think about when we get there: who sees a post (friends only, or chosen ones), whether posting is always a choice per brew (never automatic), comments and reactions, notifications for them (Settings already has the kinds), and taking a post down again.

## Fill in a coffee from a link or a photo (when the app takes off)
- **The idea:** paste the shop link or take a photo of the bag, and the coffee form comes back filled in (name, roaster, origin, process, variety, altitude, roast date, tasting notes, weight, price), marked so you check it before saving.
- **How:** one helper in Supabase (an Edge Function, like "notify"): it reads the shop page (many roasters use Shopify, with clean product data) or the photo, and an AI model picks out the fields from the description or the label.
- **Why not yet:** it costs a little per bag read (typically well under a cent with a small model, paid to the AI provider). Needs an API key, entered as a Supabase secret by us, a daily limit per account so nobody can run up a bill, and a line on the privacy page (the link or photo is sent to the AI provider to be read, not kept).
- **Limits:** some shops block automatic visitors (then the photo is the fallback); a shop's price can be for another size than the one bought.
- **Free meanwhile:** the iPhone's Live Text (camera or photo) to copy the label text into the form.

## App
- **Language setting** (English / German / Spanish). Means moving all texts into one file per language.
- **Offline use:** open the app and log brews without a connection, saved once back online.
- **Dark home-screen icon:** not possible for web apps on the iPhone; only one icon. A darker icon that suits both modes is an option.
- **Real app in the App Store:** wrap the existing pages (e.g. with Capacitor). Needs an Apple Developer account and a Mac.
- **Before going public:** Impressum (who is responsible, with an address), the data processing agreements with Supabase and Resend.

## Done (from earlier versions of this list)
Own domain and email (alto-andino.com, Resend), households with invites, open sign-up with captcha, several tasters per brew (members, guests and friends), drink and milk per taster, settings page, the coffee drinks chapter, graph per recipe over days since roast or open, charts of grind against time and taste, editing and deleting old entries, the roasting chapter, notifications ("someone made you a coffee"), the caffeine counter on Home, decaf, account deletion and download, the privacy page, friends (shelves and recipes, trending, barista board, profiles), members for a while, milk or black (Insights).
