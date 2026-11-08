(() => {
  const storageKey = "little-dreamland-app-world-v1";
  const scene = document.getElementById("play-scene");
  const status = document.getElementById("world-status");
  const saveStatus = document.getElementById("world-save-status");
  const plots = document.getElementById("garden-plots");
  const gardenTools = document.getElementById("garden-tools");
  const horse = document.getElementById("horse");
  const monster = document.getElementById("monster");
  const monsterHelp = document.getElementById("monster-help");
  const monsterInstruction = document.getElementById("monster-instruction");
  const roomScene = document.getElementById("room-scene");
  const roomFurniture = document.getElementById("room-furniture");
  const roomMenu = document.getElementById("room-menu");
  const roomActions = document.getElementById("room-actions");
  const roomArt = document.getElementById("room-art");
  const roomHero = document.getElementById("room-hero");
  const castleMap = document.getElementById("castle-map");
  const door = document.getElementById("castle-door");
  const roomGame = document.getElementById("room-game");
  const weatherLayer = document.getElementById("weather-layer");
  const furnitureIcons = { chair: "🪑", table: "🪵", lamp: "💡", "plant-decor": "🪴", rug: "🧶" };
  const outfits = ["pink", "blue", "gold"];
  const weatherNames = ["☀️ Clear", "🌧️ Rain", "⛈️ Thunderstorm", "❄️ Snow", "🌤️ Clearing"];
  const weatherPattern = [0, 1, 2, 4, 3, 1, 4, 2, 0, 3, 4, 1, 3, 2, 0];
  let state;
  let lastWeather = -1;
  let lastStages = "";
  let mounted = false;
  let canSave = true;
  let audioContext = null;
  let roomPosition = { x: 16, y: 76 };
  let gardenTool = null;
  let hallItems = [];
  let ingredients = [];
  const treasureIcons = { crown: "👑", gem: "💎", key: "🗝️", flower: "🌷", star: "⭐" };
  const ingredientIcons = { flour: "🌾", egg: "🥚", strawberry: "🍓" };
  const diningFriends = { bunny: "🐰", unicorn: "🦄", dragon: "🐉" };
  const rooms = ["hall", "kitchen", "dining", "bedroom"];

  function initialState() {
    return {
      version: 1,
      startedAt: Date.now(),
      startingSeason: currentSeason(new Date()),
      plants: [null, null, null, null],
      gardenWork: [null, null, null, null],
      furniture: { hall: [], kitchen: [], dining: [], bedroom: [] },
      outfit: "pink",
      meals: 0,
      servedMeals: 0,
      horse: { x: 14, y: 62 },
      calmUntil: 0,
    };
  }

  function load() {
    try {
      const saved = localStorage.getItem(storageKey) ?? localStorage.getItem("little-dreamland-world-v1");
      if (!saved) return initialState();
      const data = JSON.parse(saved);
      if (data.version !== 1 || !Number.isFinite(data.startedAt) ||
          !seasons.includes(data.startingSeason) || !Array.isArray(data.plants) ||
          data.plants.length !== 4 || !data.plants.every((value) => value === null || Number.isFinite(value)) ||
          (data.gardenWork !== undefined && (!Array.isArray(data.gardenWork) || data.gardenWork.length !== 4 ||
            !data.gardenWork.every((value, index) => [null, "hole", "seed", "buried"].includes(value) &&
              (value === null || data.plants[index] === null)))) ||
          !data.furniture || !["hall", "kitchen", "bedroom"].every((room) =>
            Array.isArray(data.furniture[room]) && data.furniture[room].length <= 12 &&
            data.furniture[room].every((item) => item && Object.hasOwn(furnitureIcons, item.kind) &&
              Number.isFinite(item.x) && item.x >= 0 && item.x <= 100 && Number.isFinite(item.y) && item.y >= 0 && item.y <= 100)) ||
          (data.furniture.dining !== undefined && (!Array.isArray(data.furniture.dining) ||
            data.furniture.dining.length > 12 || !data.furniture.dining.every((item) => item &&
              Object.hasOwn(furnitureIcons, item.kind) && Number.isFinite(item.x) && item.x >= 0 && item.x <= 100 &&
              Number.isFinite(item.y) && item.y >= 0 && item.y <= 100))) ||
          !outfits.includes(data.outfit) || !Number.isInteger(data.meals) || data.meals < 0 ||
          (data.servedMeals !== undefined && (!Number.isInteger(data.servedMeals) || data.servedMeals < 0 || data.servedMeals > data.meals)) ||
          !data.horse || !Number.isFinite(data.horse.x) || data.horse.x < 0 || data.horse.x > 100 ||
          !Number.isFinite(data.horse.y) || data.horse.y < 0 || data.horse.y > 100 || !Number.isFinite(data.calmUntil)) {
        throw new Error("Saved world data is invalid.");
      }
      data.furniture.dining ??= [];
      data.servedMeals ??= 0;
      data.gardenWork ??= [null, null, null, null];
      return data;
    } catch (error) {
      console.error("Could not load the saved world:", error);
      canSave = false;
      saveStatus.textContent = "The saved world could not be loaded. Saving is disabled so the existing data is not overwritten.";
      return initialState();
    }
  }

  function save() {
    if (!canSave) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      saveStatus.textContent = "";
    } catch (error) {
      console.error("Could not save the world:", error);
      saveStatus.textContent = "This browser couldn't save your world. Changes may be lost when you leave.";
    }
  }

  function say(message) {
    status.textContent = message;
    return message;
  }

  function stages(now) {
    return state.plants.map((planted) => {
      if (planted === null) return 0;
      const age = Math.max(0, now - planted);
      return age < 10000 ? 1 : age < 25000 ? 2 : 3;
    });
  }

  function drawPlants() {
    const current = stages(Date.now());
    const key = `${current.join(",")}|${state.gardenWork.join(",")}`;
    if (key === lastStages) return;
    lastStages = key;
    plots.replaceChildren();
    current.forEach((stage, index) => {
      const button = document.createElement("button");
      button.type = "button";
      const work = state.gardenWork[index];
      button.dataset.stage = work || (stage ? "growing" : "empty");
      if (work === "seed") {
        const svg = svgElement("svg", { class: "seed-icon", viewBox: "0 0 32 32", "aria-hidden": "true" });
        svg.append(
          svgElement("path", { d: "M25 5C16 5 7 11 6 19c-1 6 3 9 8 8C22 26 27 15 25 5Z", fill: "#aa7149", stroke: "#67472f", "stroke-width": "2" }),
          svgElement("path", { d: "M9 22c3-4 7-8 12-11", fill: "none", stroke: "#e8c89f", "stroke-width": "2", "stroke-linecap": "round" }),
        );
        button.append(svg);
      } else {
        button.textContent = work === "hole" ? "🕳️" : work === "buried" ? "✨" : ["", "💧", "🌱", "🌷"][stage];
      }
      const description = { hole: "hole, add a seed", seed: "seed in hole, cover with the shovel", buried: "covered seed, water it" }[work] ||
        ["empty, dig a hole", "watered seed", "sprout", "flower, pick to plant again"][stage];
      button.setAttribute("aria-label", `Garden plot ${index + 1}: ${description}`);
      button.addEventListener("pointerdown", (event) => event.stopPropagation());
      button.addEventListener("click", () => {
        if (gardenTool) {
          gardenAction(gardenTool, index, true);
        } else if (stages(Date.now())[index] === 3) {
          state.plants[index] = null;
          save();
          drawPlants();
          say("You picked a flower! Now there's room for another seed.");
        } else if (state.plants[index] !== null) {
          say("Your plant is growing! You can give it a drink while you wait.");
        } else {
          const next = { hole: "seed", seed: "dig", buried: "water" }[state.gardenWork[index]] || "dig";
          gardenAction(next, index, true);
        }
      });
      plots.append(button);
    });
  }

  function selectGardenTool(tool) {
    gardenTool = tool;
    gardenTools.querySelectorAll("[data-garden-tool]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.gardenTool === tool));
    });
  }

  function gardenAction(tool, index, restoreFocus = false) {
    if (scene.dataset.room !== "outside") return say("Go outside to tend the garden.");
    if (index < 0 || index >= state.plants.length) return say("There isn't a plot ready for that. Try another garden step.");
    const work = state.gardenWork[index];
    let message;
    if (tool === "dig" && state.plants[index] === null && work === null) {
      state.gardenWork[index] = "hole";
      message = "You dug a little hole! Put a seed in it.";
    } else if (tool === "seed" && work === "hole") {
      state.gardenWork[index] = "seed";
      message = "A seed is in the hole! Use the shovel to cover it.";
    } else if (tool === "dig" && work === "seed") {
      state.gardenWork[index] = "buried";
      message = "The seed is tucked under the soil! Give it some water.";
    } else if (tool === "water" && work === "buried") {
      state.gardenWork[index] = null;
      state.plants[index] = Date.now();
      message = "You watered the seed! Watch it sprout and bloom.";
    } else if (tool === "water" && state.plants[index] !== null) {
      selectGardenTool(null);
      return say("You gave the plant a drink! 💧");
    } else {
      return say({ dig: "Use the shovel on empty soil or a seed in a hole.", seed: "First dig a hole for your seed.", water: "Cover a seed with soil before watering it." }[tool]);
    }
    selectGardenTool(null);
    save();
    drawPlants();
    if (restoreFocus) plots.children[index].focus({ preventScroll: true });
    return say(message);
  }

  function plant(index = state.plants.findIndex((value, i) => value === null && state.gardenWork[i] === null)) {
    if (scene.dataset.room !== "outside") return say("Go outside to plant seeds.");
    if (index < 0 || state.plants[index] !== null || state.gardenWork[index] !== null) return say("There isn't an empty plot. Finish planting or pick a flower first.");
    state.plants[index] = Date.now();
    save();
    drawPlants();
    return say("A seed is planted! Watch it sprout and bloom.");
  }

  function placeHorse(x, y) {
    state.horse.x = Math.max(7, Math.min(93, x));
    state.horse.y = Math.max(12, Math.min(88, y));
    horse.style.left = `${state.horse.x}%`;
    horse.style.top = `${state.horse.y}%`;
    horse.style.bottom = "auto";
    horse.style.transform = "translate(-50%, -50%)";
  }

  let drag = null;
  horse.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.stopPropagation();
    drag = { x: event.clientX, y: event.clientY, moved: false };
    horse.setPointerCapture(event.pointerId);
  });
  horse.addEventListener("pointermove", (event) => {
    if (!drag || !horse.hasPointerCapture(event.pointerId)) return;
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 8) drag.moved = true;
    if (!drag.moved) return;
    const bounds = scene.getBoundingClientRect();
    placeHorse((event.clientX - bounds.left) / bounds.width * 100, (event.clientY - bounds.top) / bounds.height * 100);
    if (mounted) moveCharacter(document.getElementById("play-hero"), state.horse.x, state.horse.y - 12);
  });
  horse.addEventListener("pointerup", () => {
    if (drag && drag.moved) save();
    drag = null;
  });
  horse.addEventListener("pointercancel", () => {
    if (drag && drag.moved) save();
    drag = null;
  });
  horse.addEventListener("keydown", (event) => {
    const moves = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] };
    if (!moves[event.key]) return;
    event.preventDefault();
    const [dx, dy] = moves[event.key];
    placeHorse(state.horse.x + dx, state.horse.y + dy);
    if (mounted) moveCharacter(document.getElementById("play-hero"), state.horse.x, state.horse.y - 12);
    save();
  });

  function drawFurniture() {
    roomFurniture.replaceChildren();
    const room = scene.dataset.room;
    if (!state.furniture[room]) return;
    state.furniture[room].forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = furnitureIcons[item.kind];
      button.setAttribute("aria-label", `${item.kind}. Drag or use arrow keys to move.`);
      button.style.left = `${item.x}%`;
      button.style.top = `${item.y}%`;
      let pointer = null;
      function move(x, y) {
        item.x = Math.max(8, Math.min(92, x));
        item.y = Math.max(12, Math.min(88, y));
        button.style.left = `${item.x}%`;
        button.style.top = `${item.y}%`;
      }
      button.addEventListener("pointerdown", (event) => {
        if (!event.isPrimary || event.button !== 0) return;
        pointer = event.pointerId;
        button.setPointerCapture(pointer);
      });
      button.addEventListener("pointermove", (event) => {
        if (pointer !== event.pointerId) return;
        const bounds = scene.getBoundingClientRect();
        move((event.clientX - bounds.left) / bounds.width * 100, (event.clientY - bounds.top) / bounds.height * 100);
      });
      button.addEventListener("pointerup", () => { pointer = null; save(); });
      button.addEventListener("pointercancel", () => { pointer = null; save(); });
      button.addEventListener("keydown", (event) => {
        const moves = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] };
        if (!moves[event.key]) return;
        event.preventDefault();
        const [dx, dy] = moves[event.key];
        move(item.x + dx, item.y + dy);
        save();
      });
      roomFurniture.append(button);
    });
  }

  function moveRoomHero(x, y) {
    roomPosition = { x: Math.max(8, Math.min(92, x)), y: Math.max(20, Math.min(84, y)) };
    roomHero.style.left = `${roomPosition.x}%`;
    roomHero.style.top = `${roomPosition.y}%`;
  }

  function newHunt() {
    hallItems = Object.keys(treasureIcons).map((name) => ({ name, found: false }));
    for (let i = hallItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [hallItems[i], hallItems[j]] = [hallItems[j], hallItems[i]];
    }
  }

  function gameSound() {
    if (!audioContext || audioContext.state !== "running") return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 660;
    gain.gain.setValueAtTime(.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .25);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + .25);
  }

  function drawGame() {
    roomGame.replaceChildren();
    const room = scene.dataset.room;
    if (!rooms.includes(room)) return;
    let prompt;
    let options;
    if (room === "hall") {
      const found = hallItems.filter((item) => item.found).length;
      prompt = found === hallItems.length ? "You found them all! ✨" : `Find the hidden treasures! ${found} / ${hallItems.length} ✨`;
      options = hallItems.map((item, index) => ({
        icon: item.found ? treasureIcons[item.name] : "🎁",
        label: item.found ? `Found ${item.name}` : `Open mystery gift ${index + 1}`,
        name: `hunt-${index}`, disabled: item.found,
      }));
      if (found === hallItems.length) options.push({ icon: "🔄", label: "Play treasure hunt again", name: "hunt-again" });
    } else if (room === "kitchen") {
      prompt = "Make a treat! Pick all three ingredients.";
      options = Object.entries(ingredientIcons).map(([name, icon]) => ({
        icon, label: `${ingredients.includes(name) ? "Added" : "Add"} ${name}`, name: `ingredient-${name}`,
        disabled: ingredients.includes(name),
      }));
    } else if (room === "dining") {
      const available = state.meals - state.servedMeals;
      prompt = available ? `Serve a friend! Treats ready: ${available} 🧁` : "No treats yet! Make one in the kitchen. 🧁";
      options = Object.entries(diningFriends).map(([name, icon]) => ({
        icon, label: `Serve the ${name}`, name: `serve-${name}`, disabled: !available,
      }));
      if (!available) options.push({ icon: "🍳", label: "Go to kitchen", name: "kitchen" });
    } else {
      prompt = "Get ready for the royal party! Pick a dress.";
      options = outfits.map((name) => ({
        icon: { pink: "💖", blue: "💙", gold: "💛" }[name],
        label: `Wear the ${name} dress`, name: `outfit-${name}`, selected: state.outfit === name,
      }));
      options.push({ icon: "🎉", label: "Dance at the party", name: "party" });
    }
    const heading = document.createElement("p");
    heading.textContent = prompt;
    const readPrompt = document.createElement("button");
    readPrompt.type = "button";
    readPrompt.className = "room-game-read";
    readPrompt.textContent = "🔊";
    readPrompt.setAttribute("aria-label", "Read the game instructions aloud");
    readPrompt.addEventListener("click", () => speakText(prompt, () => {
      if (voiceMode) speakPrompt();
      else setVoiceState("off", "○ Voice is off");
    }));
    const choices = document.createElement("div");
    choices.className = "room-game-choices";
    for (const item of options) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = item.icon;
      button.setAttribute("aria-label", item.label);
      button.title = item.label;
      button.disabled = Boolean(item.disabled);
      if (item.selected !== undefined) button.setAttribute("aria-pressed", String(item.selected));
      button.addEventListener("click", () => gameAction(item.name));
      choices.append(button);
    }
    heading.append(" ", readPrompt);
    roomGame.append(heading, choices);
  }

  function gameAction(name) {
    const room = scene.dataset.room;
    if (name === "kitchen" && room === "dining") return action("kitchen");
    let message;
    if (room === "hall" && name === "hunt-again") {
      newHunt();
      message = "A new treasure hunt! Open the gifts to find the treasures.";
    } else if (room === "hall" && name.startsWith("hunt-")) {
      const item = hallItems[Number(name.slice(5))];
      if (!item || item.found) return say("Try another mystery gift.");
      item.found = true;
      message = hallItems.every((treasure) => treasure.found)
        ? `You found the ${item.name} and all the treasures! Play again!`
        : `You found a ${item.name}! Keep looking for treasures.`;
    } else if (room === "kitchen" && name.startsWith("ingredient-")) {
      const ingredient = name.slice(11);
      if (!Object.hasOwn(ingredientIcons, ingredient) || ingredients.includes(ingredient)) return say("Pick another ingredient.");
      ingredients.push(ingredient);
      if (ingredients.length === Object.keys(ingredientIcons).length) {
        state.meals++;
        ingredients = [];
        roomArt.textContent = "✨ 🧁 ✨";
        save();
        message = "Yum! Your treat is ready. Take it to a friend in the dining room!";
      } else {
        message = `Added ${ingredient}! Pick another ingredient.`;
      }
    } else if (room === "dining" && name.startsWith("serve-")) {
      const friend = name.slice(6);
      if (!Object.hasOwn(diningFriends, friend)) return say("Choose a castle friend.");
      if (state.meals <= state.servedMeals) return say("Make a treat in the kitchen first.");
      state.servedMeals++;
      roomArt.textContent = `${diningFriends[friend]} 🧁 💖`;
      save();
      message = `The ${friend} loves your treat! Make another in the kitchen.`;
    } else if (room === "bedroom" && name.startsWith("outfit-")) {
      const outfit = name.slice(7);
      if (!outfits.includes(outfit)) return say("Choose a dress color.");
      if (selection.hero !== "princess") return say("Choose the princess to try on a dress.");
      state.outfit = outfit;
      applyOutfit();
      roomArt.textContent = `🪞 ${{ pink: "💖", blue: "💙", gold: "💛" }[outfit]} 👗`;
      save();
      message = `A lovely ${outfit} dress! Now let's dance at the party.`;
    } else if (room === "bedroom" && name === "party") {
      roomArt.textContent = "🎈 🎉 🎈";
      roomHero.classList.remove("party-dance");
      void roomHero.offsetWidth;
      roomHero.classList.add("party-dance");
      message = "Hooray! Dance at the royal party! 🎉";
    } else {
      return null;
    }
    gameSound();
    drawGame();
    return say(message);
  }

  function showRoom(room) {
    mounted = false;
    horse.classList.remove("riding");
    scene.dataset.room = room;
    roomScene.hidden = room === "outside";
    gardenTools.hidden = room !== "outside";
    selectGardenTool(null);
    castleMap.hidden = room !== "map";
    roomMenu.hidden = room === "outside";
    roomActions.hidden = !rooms.includes(room);
    document.getElementById("cook-action").hidden = room !== "kitchen";
    document.getElementById("dress-action").hidden = room !== "bedroom";
    document.getElementById("room-title").textContent = { map: "Castle map", hall: "The hall", kitchen: "The kitchen", dining: "The dining room", bedroom: "The bedroom" }[room] || "";
    roomArt.textContent = { hall: "🪟 ✨ 🪟", kitchen: "🍳 🧁 🥣", dining: "🪑 🍽️ 🪑", bedroom: "🪞 🛏️ 🎀" }[room] || "";
    if (room === "kitchen" && state.meals > 0) roomArt.textContent = state.meals % 2 ? "🍳 🥞 🍓" : "🥣 🧁 🍓";
    if (room === "bedroom") roomArt.textContent = `🪞 ${state.outfit === "blue" ? "💙" : state.outfit === "gold" ? "💛" : "💖"} 👗`;
    const hero = choices.hero[selection.hero];
    if (hero.image) {
      const image = document.createElement("img");
      image.src = hero.image;
      image.alt = "";
      roomHero.replaceChildren(image);
    } else {
      roomHero.textContent = hero.picture;
    }
    roomHero.hidden = room === "map";
    roomHero.classList.remove("party-dance");
    moveRoomHero(16, 76);
    if (!hallItems.length) newHunt();
    drawGame();
    applyOutfit();
    drawFurniture();
    tick();
  }

  function addFurniture(kind) {
    const room = scene.dataset.room;
    if (!state.furniture[room]) return say("Choose a room on the castle map first.");
    if (state.furniture[room].length >= 12) return say("This room is full of furniture!");
    const count = state.furniture[room].length;
    state.furniture[room].push({ kind, x: 20 + (count % 5) * 15, y: 72 + Math.floor(count / 5) * 8 });
    save();
    drawFurniture();
    return say(`A ${kind} is in the room. Drag it to a new spot!`);
  }

  function action(name) {
    if (name === "visit") {
      const leavingRoom = scene.dataset.room !== "outside";
      showRoom("outside");
      scene.dataset.place = "castle";
      const hero = document.getElementById("play-hero");
      if (leavingRoom && hero) moveCharacter(hero, 50, 84);
      tick();
      return say("You're at the castle! Cross the bridge or click the door to go inside.");
    }
    if (name === "castle") {
      showRoom("map");
      return say("Welcome to the castle! Choose the hall, kitchen, dining room, or bedroom.");
    }
    if (name === "outside") {
      const leavingCastle = scene.dataset.room !== "outside" && scene.dataset.place === "castle";
      showRoom("outside");
      const hero = document.getElementById("play-hero");
      if (leavingCastle && hero) moveCharacter(hero, 50, 84);
      return say("Back outside, ready for an adventure!");
    }
    if (rooms.includes(name)) {
      showRoom(name);
      const instructions = {
        hall: "Open the mystery gifts to find the treasures!",
        kitchen: "Pick the flour, egg, and strawberry to make a treat!",
        dining: "Serve a treat to a friend, or make one in the kitchen!",
        bedroom: "Pick a dress color, then dance at the royal party!",
      };
      return say(`Welcome to the ${name}! ${instructions[name]}`);
    }
    if (name === "plant") return plant();
    if (Object.hasOwn(furnitureIcons, name)) return addFurniture(name);
    if (name === "cook") {
      if (scene.dataset.room !== "kitchen") return say("Go to the kitchen to cook.");
      return say("Pick the flour, egg, and strawberry to make a treat!");
    }
    if (name === "dress") {
      if (scene.dataset.room !== "bedroom") return say("Go to the bedroom to change your dress.");
      if (selection.hero !== "princess") return say("Choose the princess to try on a dress.");
      state.outfit = outfits[(outfits.indexOf(state.outfit) + 1) % outfits.length];
      applyOutfit();
      save();
      roomArt.textContent = `🪞 ${state.outfit === "blue" ? "💙" : state.outfit === "gold" ? "💛" : "💖"} 👗`;
      drawGame();
      return say(`A lovely ${state.outfit} dress!`);
    }
    if (name === "pet" || name === "ride") {
      if (scene.dataset.room !== "outside") return say("Go outside to find the horse.");
      if (name === "pet") return say("The horse loves your gentle pat! 💗");
      mounted = !mounted;
      horse.classList.toggle("riding", mounted);
      if (mounted) moveCharacter(document.getElementById("play-hero"), state.horse.x, state.horse.y - 12);
      return say(mounted ? "You're riding! Move your hero to ride together." : "You hopped off the horse.");
    }
    if (name === "protect") {
      if (scene.dataset.room !== "outside" || scene.dataset.place !== "castle") return say("Visit the castle outside to help.");
      if (Date.now() < state.calmUntil) return say("The monsters are already playing happily!");
      state.calmUntil = Date.now() + 45000;
      save();
      tick();
      return say("You shared a sparkle! The monsters stop bumping the castle and play nicely.");
    }
    return null;
  }

  function applyOutfit() {
    const hero = document.getElementById("play-hero");
    if (hero) {
      hero.classList.remove("dress-blue", "dress-gold");
      if (state.outfit !== "pink") hero.classList.add(`dress-${state.outfit}`);
    }
    roomHero.classList.remove("dress-blue", "dress-gold");
    if (state.outfit !== "pink") roomHero.classList.add(`dress-${state.outfit}`);
  }

  function drawWeather(index) {
    weatherLayer.replaceChildren();
    if (index === 0 || index === 4) return;
    for (let i = 0; i < 16; i++) {
      const particle = document.createElement("span");
      particle.textContent = index === 3 ? "❄" : "💧";
      particle.style.left = `${(i * 37) % 100}%`;
      particle.style.animationDelay = `${-(i % 7) * .3}s`;
      weatherLayer.append(particle);
    }
    if (index === 2) {
      const bolt = document.createElement("span");
      bolt.className = "lightning";
      bolt.textContent = "⚡";
      weatherLayer.append(bolt);
    }
  }

  function playThunder() {
    if (!audioContext || audioContext.state !== "running") return;
    const length = audioContext.sampleRate * 2;
    const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
    const samples = buffer.getChannelData(0);
    let rumble = 0;
    for (let i = 0; i < samples.length; i++) {
      rumble = .98 * rumble + .02 * (Math.random() * 2 - 1);
      samples[i] = rumble * Math.exp(-i / (audioContext.sampleRate * .6));
    }
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    gain.gain.value = .3;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(audioContext.destination);
    source.start();
  }

  function tick() {
    if (!state || playArea.hidden) return;
    updateSeason();
    const elapsed = Math.max(0, Date.now() - state.startedAt);
    const weather = weatherPattern[Math.floor(elapsed / 20000) % weatherPattern.length];
    document.getElementById("season-label").textContent += ` · ${weatherNames[weather]}`;
    if (weather !== lastWeather) {
      lastWeather = weather;
      drawWeather(weather);
      if (weather === 2) playThunder();
    }
    const active = Date.now() >= state.calmUntil;
    scene.dataset.monster = active ? "active" : "calm";
    monster.hidden = scene.dataset.place !== "castle";
    monster.classList.toggle("calm", !active);
    monster.textContent = active ? "👾💨👹" : "👾💖👹";
    monster.setAttribute("aria-label", active ? "Share a sparkle with the monsters" : "The monsters are playing nicely");
    monsterHelp.hidden = scene.dataset.place !== "castle" || scene.dataset.room !== "outside";
    monsterInstruction.textContent = active
      ? "They’re bumping the castle. Click them, share a sparkle, or say “help the castle” when listening."
      : "You shared a sparkle! The monsters are playing nicely. They might get bouncy again soon.";
    drawPlants();
  }

  document.querySelectorAll("[data-world]").forEach((button) => {
    button.addEventListener("click", () => action(button.dataset.world));
  });
  gardenTools.querySelectorAll("[data-garden-tool]").forEach((button) => {
    button.addEventListener("click", () => {
      const tool = button.dataset.gardenTool;
      selectGardenTool(gardenTool === tool ? null : tool);
      say(gardenTool ? {
        dig: "Shovel ready! Choose a plot to dig or cover a seed.",
        seed: "Seeds ready! Choose a dug hole.",
        water: "Watering can ready! Choose a covered seed or plant.",
      }[tool] : "Choose a garden tool or click a plot to plant step by step.");
    });
  });
  door.addEventListener("click", () => action("castle"));
  roomScene.addEventListener("pointerdown", (event) => {
    if (event.target !== roomScene || scene.dataset.room === "map") return;
    const bounds = scene.getBoundingClientRect();
    moveRoomHero((event.clientX - bounds.left) / bounds.width * 100, (event.clientY - bounds.top) / bounds.height * 100);
  });
  let roomDrag = null;
  roomHero.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    roomDrag = event.pointerId;
    roomHero.setPointerCapture(roomDrag);
  });
  roomHero.addEventListener("pointermove", (event) => {
    if (roomDrag !== event.pointerId) return;
    const bounds = scene.getBoundingClientRect();
    moveRoomHero((event.clientX - bounds.left) / bounds.width * 100, (event.clientY - bounds.top) / bounds.height * 100);
  });
  roomHero.addEventListener("pointerup", () => { roomDrag = null; });
  roomHero.addEventListener("pointercancel", () => { roomDrag = null; });
  roomHero.addEventListener("keydown", (event) => {
    const moves = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] };
    if (!moves[event.key]) return;
    event.preventDefault();
    moveRoomHero(roomPosition.x + moves[event.key][0], roomPosition.y + moves[event.key][1]);
  });
  monster.addEventListener("pointerdown", (event) => event.stopPropagation());
  monster.addEventListener("click", () => action("protect"));

  window.World = {
    start() {
      if (!state) {
        state = load();
        save();
      }
      worldStartedAt = state.startedAt;
      startingSeason = state.startingSeason;
      scene.dataset.room = "outside";
      showRoom("outside");
      placeHorse(state.horse.x, state.horse.y);
      applyOutfit();
      lastStages = "";
      lastWeather = -1;
      drawPlants();
      tick();
    },
    enableAudio() {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        say("Game sounds aren't available in this browser.");
        return;
      }
      if (!audioContext) {
        try {
          audioContext = new AudioContext();
        } catch (error) {
          console.error("Could not initialize weather sounds:", error);
          say("Weather sounds are unavailable. Check your browser sound settings.");
        }
      }
      if (audioContext && audioContext.state === "suspended") {
        audioContext.resume().catch((error) => {
          console.error("Could not enable weather sounds:", error);
          say("Weather sounds are unavailable. Check your browser sound settings.");
        });
      }
    },
    stop() {
      mounted = false;
      horse.classList.remove("riding");
    },
    tick,
    moveInterior(dx, dy) {
      if (scene.dataset.room === "outside") return false;
      if (scene.dataset.room !== "map") moveRoomHero(roomPosition.x + dx, roomPosition.y + dy);
      else say("Choose a room on the castle map first.");
      return true;
    },
    checkEntrance() {
      if (!state || scene.dataset.room !== "outside" || scene.dataset.place !== "castle") return false;
      const hero = document.getElementById("play-hero");
      if (!hero) return false;
      const heroBounds = hero.getBoundingClientRect();
      const doorBounds = door.getBoundingClientRect();
      const centerX = (heroBounds.left + heroBounds.right) / 2;
      if (Math.abs(centerX - (doorBounds.left + doorBounds.right) / 2) > 30 ||
          Math.abs(heroBounds.bottom - doorBounds.bottom) > 24) return false;
      action("castle");
      return true;
    },
    heroMoved(hero) {
      if (!state || !mounted || hero.id !== "play-hero") return;
      placeHorse(Number(hero.dataset.x), Number(hero.dataset.y) + 12);
      save();
    },
    command(text) {
      if (/\b(?:dig|make) (?:a |the )?(?:hole|soil|plot)\b/.test(text)) {
        return gardenAction("dig", state.gardenWork.findIndex((work, i) => work === null && state.plants[i] === null));
      }
      if (/\b(?:put|place|add|drop) (?:a |the )?seed\b/.test(text)) return gardenAction("seed", state.gardenWork.indexOf("hole"));
      if (/\b(?:bury|cover) (?:the |a )?seed\b/.test(text)) return gardenAction("dig", state.gardenWork.indexOf("seed"));
      if (/\bwater (?:the |a )?(?:seed|plant|flower)\b/.test(text)) {
        const buried = state.gardenWork.indexOf("buried");
        return gardenAction("water", buried >= 0 ? buried : state.plants.findIndex((plant) => plant !== null));
      }
      let match = text.match(/\b(?:find|open) (?:the |a )?(crown|gem|key|flower|star)\b/);
      if (match && scene.dataset.room === "hall") {
        return gameAction(`hunt-${hallItems.findIndex((item) => item.name === match[1] && !item.found)}`);
      }
      match = text.match(/\b(?:add|pick) (?:the |an? )?(flour|egg|strawberry)\b/);
      if (match) return gameAction(`ingredient-${match[1]}`) || say("Go to the kitchen to make a treat.");
      match = text.match(/\b(?:serve|feed) (?:the )?(bunny|unicorn|dragon)\b/);
      if (match) return gameAction(`serve-${match[1]}`) || say("Go to the dining room to serve a friend.");
      match = text.match(/\b(?:wear|choose) (?:the )?(pink|blue|gold)(?: dress)?\b/);
      if (match) return gameAction(`outfit-${match[1]}`) || say("Go to the bedroom to choose a dress.");
      if (/\b(?:dance|party)\b/.test(text) && scene.dataset.room === "bedroom") return gameAction("party");
      if (/\b(?:new|again|restart) (?:treasure )?hunt\b/.test(text) && scene.dataset.room === "hall") return gameAction("hunt-again");
      const patterns = [
        [/\b(?:plant|grow)(?: a)? seed\b|\bplant flowers?\b/, "plant"],
        [/\bvisit (?:the )?castle\b/, "visit"],
        [/\b(?:enter|open|go to) (?:the )?castle\b|\bcastle map\b/, "castle"],
        [/\b(?:go )?(?:to )?(?:the )?(hall|kitchen|dining(?: room)?|bedroom)\b/, null],
        [/\b(?:go )?outside\b/, "outside"],
        [/\bpet (?:the )?horse\b/, "pet"],
        [/\b(?:ride|mount|dismount) (?:the )?horse\b/, "ride"],
        [/\b(?:help|protect|save) (?:the )?castle\b/, "protect"],
        [/\b(?:add|place) (?:a )?(chair|table|lamp|rug)\b/, null],
        [/\b(?:cook|make food)\b/, "cook"],
        [/\b(?:change|new) (?:my |the )?(?:dress|clothes)\b/, "dress"],
      ];
      for (const [pattern, name] of patterns) {
        const match = text.match(pattern);
        if (match) return action(name || (match[1] === "dining room" ? "dining" : match[1]));
      }
      return null;
    },
  };
})();
