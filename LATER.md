# Later

Ideas for after the basics have settled. Nothing here is promised; it is the list we pick from.

## Own domain and email
Bundled with the Apple Developer account, so the external costs come together.
- ~~Own domain for the app~~ done: alto-andino.com.
- Email service (Brevo or similar) as custom SMTP in Supabase. Then "Confirm email" can go back on and "Forgot password" sends real emails.

## Friends and households
- **Friends:** share selected coffees and recipes with friends (read-only), across households.
- **Friends as tasters:** a brew can already have several tasters (members and guests). Once friends exist, a friend can be picked under "Who rates it" too; the rating stores the person, so nothing has to be rebuilt.
- **Coffee trending among your friends:** which coffees friends rate highest right now. Needs friends first.
- **Temporary household membership:** e.g. a guest or a flatmate for a few weeks. An invite with an end date, after which the person leaves the household automatically.
- **Barista ratings, as a game:** each person's average stars as a barista, compared within the household and between friends.
- **Personal profile page:** (Settings has name and defaults now) photo, favourite coffees and devices, own stats, account settings (also where "delete my account" would live, which is needed before going public).

## Notifications
- "Andrés brewed a coffee for you, do you want to rate it?"
- Possible for home-screen web apps on the iPhone (since iOS 16.4), after allowing notifications. Needs a small server part that sends them (for example a Supabase function). A brew would also need a "brewed for" field.

## Caffeine
- **Decaf** tick box on coffees: done, so the data is there from now on.
- **Caffeine counter:** an estimate per brew from the dose (about 1 to 1.5% of the coffee weight is caffeine; decaf close to zero), per day and per week in Trends.
- **Apple Health:** a home-screen web app cannot write to Apple Health directly. Options: a native iPhone app later, or an Apple Shortcut that the app opens after a brew and that logs the caffeine to Health.

## App
- **Language setting** (English / German / Spanish). Means moving all texts into one file per language.
- **Offline use:** open the app and log brews without a connection, saved once back online.
- **Dark home-screen icon:** not possible for web apps on the iPhone; only one icon. A darker icon that suits both modes is an option.
- **Real app in the App Store:** wrap the existing pages (e.g. with Capacitor). Needs an Apple Developer account and a Mac.
- **Before going public:** Impressum, privacy policy (Datenschutzerklärung), account deletion.

## Brewing and the book
- Trends by drink and milk: e.g. which coffee you like best as a flat white, and which black.
- Matching similar recipes automatically (with a tolerance for grind and pressure).
- Cup card with our latest tastings per processing method.
- Chapters still to write: tasting and extraction, how to dial in a coffee.

## Done (from earlier versions of this list)
Households with invites, open sign-up with captcha, several tasters per brew (members and guests), drink and milk per taster, settings page, the coffee drinks chapter, graph per recipe over days since roast or open, charts of grind against time and taste, editing and deleting old entries, the roasting chapter.
