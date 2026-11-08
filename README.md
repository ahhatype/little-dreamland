# Little Dreamland

## Start the game

On a Mac, open this folder in Finder, then right-click `index.html` and choose **Open With → Google Chrome**. Choose a hero, place, and adventure, then click **Play my adventure**. For voice, turn up the sound and have a grown-up click **Start voice** near the top of the game. Allow microphone access if Chrome asks; after the game speaks, wait for the green **Listening** indicator before answering.

Alternatively, open a terminal in the project folder and run `python3 -m http.server 8000`, then open `http://localhost:8000` in Chrome. Leave the terminal running while playing, and press Ctrl+C to stop the server. Browser storage for `localhost` is separate from storage for an opened file.

Drag characters, adventure objects, and gems with a mouse or finger, click or tap the scene to move the hero, or use the on-screen arrows or keyboard arrow keys. Double-click or double-tap a friend or object to make a differently colored copy; keyboard users can focus it and press Enter twice. Added friends and their copies share the six-friend limit. Answer the gentle challenges by clicking, tapping, or speaking.

The world starts in the device's current Northern Hemisphere season, then advances one season every two minutes. Day and night each last one minute.

Plant seeds in the four soil plots: they sprout after 10 seconds and bloom after 25 seconds. Click a flower to pick it and make room for a new seed. **Visit castle** takes you to the castle grounds. Move your hero across the bridge until her feet reach the door, or click the door, to open the map. Choose a room on the map; use **Castle map** to pick another room and **Outside** to return to the grounds. Inside, move your hero and add and drag furniture. Each room has a picture game and a speaker button to read the instructions:

- **Hall:** open the mystery gifts to find five magical treasures, then play again.
- **Kitchen:** pick flour, an egg, and a strawberry to make a treat.
- **Dining room:** serve a treat from the kitchen to a castle friend.
- **Bedroom:** pick the princess's dress color, then dance at the royal party.

Outside, pet or ride the horse; move the hero while mounted to ride. At the castle, the monsters bump it until you click them, click **Share a sparkle**, or say “help the castle” while listening. They then play nicely for 45 seconds. Weather changes every 20 seconds among clear skies, rain, thunderstorms, snow, and clearing. Thunder is a soft sound when browser audio is available.

The garden, room furniture, outfit, meals, horse position, monster cooldown, and world clock are saved in this browser on this device. The clock and planted seeds continue to advance while the page is closed. Other scene characters and temporary positions are not saved. If browser storage is blocked, the page displays a warning.

For hands-free play, a grown-up chooses the scene, clicks **Play my adventure**, then clicks **Start voice** and grants microphone permission. The game reads a prompt, listens for up to 30 seconds for an answer, speaks the result, and moves to the next challenge. If the browser stops listening during a pause, the game restarts listening within that window. While listening, say “move right”, “add a bunny”, “plant a seed”, “visit the castle”, “open the castle”, “kitchen”, “dining room”, “bedroom”, “outside”, “ride the horse”, “pet the horse”, “help the castle”, “add a chair”, “cook”, or “change my dress”. In the room games, say “find crown”, “add flour”, “add egg”, “add strawberry”, “serve bunny”, “wear blue”, or “dance”. It retries twice if it cannot understand and then stops and asks for help. The microphone listens only after prompts. Hands-free mode stops when the grown-up stops it, the page is hidden, the scene changes, or the challenges are complete. Moving props still uses mouse, touch, or keyboard.

Voice answers require a browser that supports the Web Speech API, microphone permission, and sometimes an internet connection. Browser speech recognition may send audio to an online recognition service; ask a grown-up first. The VS Code embedded browser may not support these services fully: open the page in Chrome or Edge, allow microphone access in browser and system settings, and check the computer's output volume for read-aloud. The voice indicator shows when the browser is speaking or listening, and displays recognized words when available. Some browsers require a secure context (HTTPS or localhost) for microphone access. If voice recognition is unavailable or doesn't understand an answer, click or tap an answer instead. The read-aloud button depends on the browser's speech synthesis support and an available system voice.

The page uses Bootstrap and Google Fonts from external servers; an internet connection is needed to load those resources.
