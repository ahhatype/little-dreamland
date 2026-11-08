# Princess Athena

This folder is an independent, installable web app containing the existing game, including gardening, castle rooms, weather and voice controls. It opens directly into the princess's castle treasure adventure. The original site remains separate.

The scene fills the screen. Choose **Adventure** to open a question, **Play** for garden tools, room actions, movement and friends, or **Voice** for grown-up microphone settings. Choose a garden tool and then a plot. Starting hands-free voice opens the question and keeps the existing microphone controls and privacy behavior.

## Run and install

From the repository folder, run:

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000/app/> in Chrome or Edge. On a phone, use an HTTPS-hosted copy: localhost on a computer is not the phone's localhost. Use the browser's **Install** or **Add to Home Screen** menu; on iPhone, use Safari's Share menu and **Add to Home Screen**. Installation and the offline cache require HTTPS or localhost. Opening `index.html` directly can play the game, but cannot enable installation or offline play.

After the first successful online load and service-worker installation, the game files are available offline. Voice recognition may still require an internet connection and microphone permission; read-aloud depends on available browser and system voices. Bootstrap and Google Fonts are not required.

## Saved worlds

The app saves under its own browser-storage key and does not change the original site's saved world. On its first run it copies a valid existing Little Dreamland world when one is available on the same origin. `file:` URLs, localhost, and deployed domains have separate browser storage, so a save from another origin is not automatically transferred. Progress remains on that browser and device.

## Structure and updates

`index.html` and `app.css` provide the app shell and mobile-first layout; `app.js` starts the game and handles installation; `script.js` and `world.js` contain the adapted existing game. Assets are local. When changing a cached app file, increment the cache name in `service-worker.js` so existing installations receive the update after existing app tabs are closed and the app is opened again.
