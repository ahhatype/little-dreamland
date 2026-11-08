const choices = {
  hero: {
    princess: { picture: "👸", image: "princess.svg", story: "A princess" },
    fairy: { picture: "🧚", story: "A fairy" },
    unicorn: { picture: "🦄", image: "unicorn.svg", story: "A unicorn" },
  },
  place: {
    castle: { picture: "🏰", story: "a magical castle" },
    garden: { picture: "🌷", story: "a magical garden" },
    clouds: { picture: "☁️", story: "the fluffy clouds" },
  },
  adventure: {
    treasure: { picture: "💎", story: "find treasure", object: "🗝️" },
    friends: { picture: "🐰", image: "bunny.svg", story: "make new friends", object: "🐉", objectImage: "dragon.svg" },
    party: { picture: "🎈", story: "have a party", object: "🎂" },
  },
};

const friends = {
  bunny: { picture: "🐰", image: "bunny.svg", label: "bunny" },
  unicorn: { picture: "🦄", image: "unicorn.svg", label: "unicorn" },
  fairy: { picture: "🧚", label: "fairy" },
};

const challenges = {
  treasure: [
    { question: "A little dragon is guarding the treasure. How can we be kind?", answers: [
      { label: "Say hello", icon: "👋", words: ["hello", "hi", "say hello"], reply: "The dragon waves hello and shares a sparkling gem!" },
      { label: "Share", icon: "💝", words: ["share", "sharing"], reply: "The dragon loves sharing and shows you a sparkling gem!" },
    ] },
    { question: "A stream is in our way! How can we cross?", answers: [
      { label: "Bridge", icon: "🌉", words: ["bridge"], reply: "You walk over the bridge and find a treasure!" },
      { label: "Boat", icon: "⛵", words: ["boat"], reply: "You sail across the stream and find a treasure!" },
    ] },
  ],
  friends: [
    { question: "A shy bunny wants a friend. What can we do?", answers: [
      { label: "Say hello", icon: "👋", words: ["hello", "hi", "say hello"], reply: "The bunny smiles and says hello back!" },
      { label: "Play", icon: "🧸", words: ["play"], reply: "The bunny hops over to play with you!" },
    ] },
    { question: "A little dragon feels sad. How can we help?", answers: [
      { label: "Hug", icon: "🤗", words: ["hug"], reply: "The dragon feels cozy and smiles!" },
      { label: "Sing", icon: "🎵", words: ["sing", "song"], reply: "Your song makes the dragon smile!" },
    ] },
  ],
  party: [
    { question: "Our party needs a little magic! What should we bring?", answers: [
      { label: "Cake", icon: "🎂", words: ["cake"], reply: "Everyone gets a slice of delicious cake!" },
      { label: "Music", icon: "🎵", words: ["music", "song"], reply: "Everyone dances to your magical music!" },
    ] },
    { question: "A friend can't find the party. How can we help?", answers: [
      { label: "Wave", icon: "👋", words: ["wave", "hello", "hi"], reply: "Your friend sees you and joins the party!" },
      { label: "Lights", icon: "✨", words: ["lights", "light"], reply: "The sparkling lights show your friend the way!" },
    ] },
  ],
};

const defaults = { hero: "princess", place: "castle", adventure: "treasure" };
const selection = { ...defaults };
const buttons = document.querySelectorAll(".choice");
const playArea = document.getElementById("play-area");
const playScene = document.getElementById("play-scene");
const characters = document.getElementById("characters");
const challengeStatus = document.getElementById("challenge-status");
const voiceFeedback = document.getElementById("voice-feedback");
const voiceButton = document.getElementById("voice-button");
const voiceModeButton = document.getElementById("voice-mode-button");
const readButton = document.getElementById("read-button");
const voiceIndicator = document.getElementById("voice-indicator");
const nextButton = document.getElementById("next-button");
let challengeIndex = 0;
let recognition = null;
let listeningTimer = null;
let restartTimer = null;
let listeningSession = null;
let readTimer = null;
let reading = null;
let answered = false;
let voiceMode = false;
let voiceRetries = 0;
let nextCopyColor = 0;
const seasons = ["spring", "summer", "autumn", "winter"];
const cycleLength = 120000;
let worldStartedAt = null;
let startingSeason = currentSeason(new Date());
new MutationObserver(() => {
  voiceFeedback.textContent = challengeStatus.textContent;
}).observe(challengeStatus, { childList: true, characterData: true, subtree: true });
if (navigator.userAgent.includes("Electron/") && navigator.userAgent.includes("Code/")) {
  document.getElementById("browser-warning").hidden = false;
}

function setVoiceState(state, message) {
  voiceIndicator.dataset.state = state;
  voiceIndicator.textContent = message;
}

function render() {
  for (const button of buttons) {
    const selected = selection[button.dataset.group] === button.dataset.value;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  }
  for (const group of Object.keys(selection)) {
    const target = document.getElementById(`scene-${group}`);
    const choice = choices[group][selection[group]];
    if (choice.image) {
      const image = document.createElement("img");
      image.src = choice.image;
      image.alt = "";
      image.draggable = false;
      image.className = choice.image === "princess.svg" ? "preview-princess" : "preview-animal";
      target.replaceChildren(image);
    } else {
      target.textContent = choice.picture;
    }
  }
  const story = `${choices.hero[selection.hero].story} sets off to ${choices.adventure[selection.adventure].story} in ${choices.place[selection.place].story}!`;
  document.getElementById("story-text").textContent = story;
  document.getElementById("play-story").textContent = story;
}

function currentSeason(date) {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

const seasonalScenery = {
  spring: { label: "🌷 Spring", trees: "🌸", bed: "🌷🌼🌷", decor: ["🌷", "🦋", "🌼"], petals: ["#f3aac5", "#f7e5a5", "#d9bce3"] },
  summer: { label: "☀️ Summer", trees: "🌳", bed: "🌻🌼🌻", decor: ["🌻", "🦋", "🌿"], petals: ["#f4c864", "#f2a9aa", "#f7e7b6"] },
  autumn: { label: "🍂 Autumn", trees: "🍁", bed: "🍂🌼🍂", decor: ["🍁", "🍂", "🍄"], petals: ["#e8a05f", "#ca7d77", "#eac989"] },
  winter: { label: "❄️ Winter", trees: "🌲", bed: "❄️🌿❄️", decor: ["❄️", "☃️", "❄️"], petals: ["#fffaf5", "#e6def6", "#f9f4ed"] },
};

function svgElement(name, attributes) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

function renderFlowers(season) {
  const bed = document.getElementById("flower-bed");
  bed.replaceChildren();
  const colors = seasonalScenery[season].petals;
  const defs = svgElement("defs", {});
  colors.forEach((color, index) => {
    const gradient = svgElement("radialGradient", { id: `petal-${index}`, cx: "50%", cy: "75%", r: "75%" });
    gradient.append(
      svgElement("stop", { offset: "0%", "stop-color": "#fff9e8" }),
      svgElement("stop", { offset: "45%", "stop-color": color }),
      svgElement("stop", { offset: "100%", "stop-color": color, "stop-opacity": ".78" }),
    );
    defs.append(gradient);
  });
  bed.append(defs);
  for (let i = 0; i < 13; i++) {
    const x = 20 + i * 47 + (i % 3 - 1) * 5;
    const height = 37 + (i % 4) * 7;
    const y = 110 - height;
    const group = svgElement("g", { class: "flower-stem" });
    const stemColor = season === "winter" ? "#879e8b" : "#6f9c72";
    group.append(
      svgElement("path", { d: `M ${x} 115 Q ${x - 5} ${y + 24} ${x} ${y}`, fill: "none", stroke: stemColor, "stroke-width": "2.5", "stroke-linecap": "round" }),
      svgElement("path", { d: `M ${x - 1} ${y + 25} Q ${x - 17} ${y + 11} ${x - 14} ${y + 28} Q ${x - 8} ${y + 31} ${x - 1} ${y + 25}`, fill: stemColor }),
      svgElement("path", { d: `M ${x} ${y + 33} Q ${x + 17} ${y + 18} ${x + 15} ${y + 35} Q ${x + 8} ${y + 38} ${x} ${y + 33}`, fill: "#91b78b" }),
    );
    const petalCount = season === "winter" ? 6 : 8;
    for (let petal = 0; petal < petalCount; petal++) {
      group.append(svgElement("ellipse", {
        cx: x, cy: y - 5, rx: 3.5 + (i % 2), ry: 8 + (i % 3),
        fill: `url(#petal-${i % colors.length})`, stroke: "#d7aeb0", "stroke-width": ".4",
        transform: `rotate(${petal * 360 / petalCount} ${x} ${y})`,
      }));
    }
    group.append(
      svgElement("circle", { cx: x, cy: y, r: 3.6, fill: "#b98446" }),
      svgElement("circle", { cx: x - 1, cy: y - 1, r: 1.8, fill: "#f6d582" }),
    );
    bed.append(group);
  }
}

function updateSeason() {
  const elapsed = worldStartedAt === null ? 0 : Math.max(0, Date.now() - worldStartedAt);
  const season = seasons[(seasons.indexOf(startingSeason) + Math.floor(elapsed / cycleLength)) % seasons.length];
  const time = elapsed % cycleLength < cycleLength / 2 ? "day" : "night";
  playScene.dataset.time = time;
  document.getElementById("sky-light").textContent = time === "day" ? "☀️" : "🌙";
  document.getElementById("season-label").textContent = `${seasonalScenery[season].label} · ${time === "day" ? "Day" : "Night"}`;
  if (playScene.dataset.season === season) return;
  playScene.dataset.season = season;
  const scenery = seasonalScenery[season];
  for (const tree of document.querySelectorAll(".garden-tree")) tree.textContent = scenery.trees;
  document.querySelector(".garden-bed").textContent = scenery.bed;
  const decor = document.getElementById("season-decor");
  decor.replaceChildren(...scenery.decor.map((item) => {
    const span = document.createElement("span");
    span.textContent = item;
    return span;
  }));
  renderFlowers(season);
}

function moveCharacter(character, x, y) {
  const bounds = playScene.getBoundingClientRect();
  const halfWidth = Math.min(character.offsetWidth / 2 / bounds.width * 100, 50);
  const halfHeight = Math.min(character.offsetHeight / 2 / bounds.height * 100, 50);
  character.dataset.x = Math.max(halfWidth, Math.min(100 - halfWidth, x));
  character.dataset.y = Math.max(halfHeight, Math.min(100 - halfHeight, y));
  character.style.left = `${character.dataset.x}%`;
  character.style.top = `${character.dataset.y}%`;
  if (window.World) window.World.heroMoved(character);
}

function addCharacter(picture, label, x, y, isHero = false, image = null, isGem = false) {
  const character = document.createElement("button");
  character.type = "button";
  character.className = "character";
  if (image) {
    const portrait = document.createElement("img");
    portrait.src = image;
    portrait.alt = "";
    portrait.draggable = false;
    character.classList.add("illustrated-character");
    if (image === "princess.svg") character.classList.add("princess-character");
    character.append(portrait);
  } else {
    const visual = document.createElement("span");
    visual.textContent = picture;
    visual.setAttribute("aria-hidden", "true");
    character.append(visual);
  }
  if (isGem) character.classList.add("movable-gem");
  character.setAttribute("aria-label", `${label}. Drag or use arrow keys to move.${isHero ? "" : " Double-click, double-tap, or press Enter twice to make a colorful copy."}`);
  if (isHero) character.id = "play-hero";
  characters.append(character);
  moveCharacter(character, x, y);
  let pointerStart = null;
  let lastActivation = null;
  function activate(source, time) {
    if (isHero) return;
    if (lastActivation && lastActivation.source === source && time - lastActivation.time <= 600) {
      lastActivation = null;
      if (character.dataset.addedFriend && characters.querySelectorAll("[data-added-friend]").length >= 6) {
        document.getElementById("friend-message").textContent = "Your scene is full of friends!";
        return;
      }
      const bounds = playScene.getBoundingClientRect();
      const offsetX = (character.offsetWidth + 8) / bounds.width * 100;
      const offsetY = (character.offsetHeight + 8) / bounds.height * 100;
      const sourceX = Number(character.dataset.x);
      const sourceY = Number(character.dataset.y);
      const halfWidth = character.offsetWidth / 2 / bounds.width * 100;
      const copyX = sourceX + offsetX <= 100 - halfWidth ? sourceX + offsetX : sourceX - offsetX;
      const copyY = copyX < halfWidth ? sourceY - offsetY : sourceY;
      const copy = addCharacter(picture, label, copyX < halfWidth ? sourceX : copyX, copyY, false, image, isGem);
      if (character.dataset.addedFriend) copy.dataset.addedFriend = "true";
      nextCopyColor = (nextCopyColor + 1) % 6;
      if (`${nextCopyColor * 60}deg` === character.style.getPropertyValue("--copy-hue")) nextCopyColor = (nextCopyColor + 1) % 6;
      copy.style.setProperty("--copy-hue", `${nextCopyColor * 60}deg`);
      copy.classList.add("colorful-copy");
      document.getElementById("friend-message").textContent = `A colorful ${label} appeared!`;
    } else {
      lastActivation = { source, time };
    }
  }
  character.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    if (!event.isPrimary || event.button !== 0) return;
    pointerStart = { x: event.clientX, y: event.clientY, moved: false };
    character.setPointerCapture(event.pointerId);
  });
  character.addEventListener("pointermove", (event) => {
    if (!pointerStart || !character.hasPointerCapture(event.pointerId)) return;
    if (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8) pointerStart.moved = true;
    if (!pointerStart.moved) return;
    const bounds = playScene.getBoundingClientRect();
    moveCharacter(character, (event.clientX - bounds.left) / bounds.width * 100, (event.clientY - bounds.top) / bounds.height * 100);
  });
  character.addEventListener("pointerup", (event) => {
    if (!pointerStart) return;
    const moved = pointerStart.moved;
    if (!pointerStart.moved) activate(event.pointerType, event.timeStamp);
    else lastActivation = null;
    pointerStart = null;
    if (isHero && moved) window.World.checkEntrance();
  });
  character.addEventListener("pointercancel", () => {
    pointerStart = null;
    lastActivation = null;
  });
  character.addEventListener("click", (event) => {
    if (event.detail === 0) activate("keyboard", event.timeStamp);
  });
  character.addEventListener("keydown", (event) => {
    const directions = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] };
    if (!directions[event.key]) return;
    event.preventDefault();
    const [dx, dy] = directions[event.key];
    moveCharacter(character, Number(character.dataset.x) + dx, Number(character.dataset.y) + dy);
    if (isHero) window.World.checkEntrance();
  });
  return character;
}

function stopListening() {
  clearTimeout(listeningTimer);
  clearTimeout(restartTimer);
  listeningTimer = null;
  restartTimer = null;
  listeningSession = null;
  if (recognition) {
    const active = recognition;
    recognition = null;
    active.abort();
  }
  voiceButton.disabled = voiceMode;
  voiceButton.textContent = "🎙️ Say my answer";
}

function stopReading() {
  clearTimeout(readTimer);
  readTimer = null;
  reading = null;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

function stopVoiceMode() {
  voiceMode = false;
  voiceRetries = 0;
  voiceModeButton.setAttribute("aria-pressed", "false");
  voiceModeButton.textContent = "🎙️ Start voice";
  readButton.disabled = false;
  stopListening();
  stopReading();
  setVoiceState("off", "○ Voice is off");
}

function renderChallenge(prefix = "") {
  stopListening();
  stopReading();
  answered = false;
  const challenge = challenges[selection.adventure][challengeIndex];
  document.getElementById("challenge-question").textContent = challenge.question;
  const answerOptions = document.getElementById("answer-options");
  answerOptions.replaceChildren();
  for (const answer of challenge.answers) {
    const button = document.createElement("button");
    button.type = "button";
    const icon = document.createElement("span");
    icon.textContent = answer.icon;
    icon.setAttribute("aria-hidden", "true");
    button.append(icon, document.createTextNode(answer.label));
    button.addEventListener("click", () => answerChallenge(answer));
    answerOptions.append(button);
  }
  challengeStatus.textContent = "";
  nextButton.hidden = true;
  if (voiceMode) speakPrompt(prefix);
}

function answerChallenge(answer) {
  if (answered) return;
  stopListening();
  stopReading();
  answered = true;
  challengeStatus.textContent = answer.reply;
  nextButton.hidden = false;
  if (!voiceMode) setVoiceState("off", "○ Voice is off");
  if (voiceMode) {
    voiceRetries = 0;
    const lastChallenge = challengeIndex === challenges[selection.adventure].length - 1;
    speakText(`${answer.reply} ${lastChallenge ? "You did it! Ask a grown-up to start another adventure." : "Let's try another adventure!"}`, () => {
      if (lastChallenge) {
        stopVoiceMode();
        challengeStatus.textContent = "Adventure complete! A grown-up can start hands-free play again.";
      } else {
        challengeIndex++;
        renderChallenge();
      }
    });
  }
}

function startAdventure() {
  stopVoiceMode();
  window.World.stop();
  startingSeason = currentSeason(new Date());
  worldStartedAt = Date.now();
  updateSeason();
  playArea.hidden = false;
  playScene.dataset.place = selection.place;
  const adventure = choices.adventure[selection.adventure];
  document.getElementById("friend-message").textContent = "";
  characters.replaceChildren();
  nextCopyColor = 0;
  const hero = choices.hero[selection.hero];
  addCharacter(hero.picture, selection.hero, 25, 77, true, hero.image);
  const objectNames = { treasure: "magic key", friends: "dragon", party: "party cake" };
  addCharacter(adventure.object, objectNames[selection.adventure], 68, 72, false, adventure.objectImage);
  for (const [index, x] of [78, 88, 95].entries()) {
    addCharacter("💎", "sparkling gem", x, 88 - index * 3, false, null, true);
  }
  window.World.start();
  challengeIndex = 0;
  renderChallenge();
  document.getElementById("play-heading").focus();
  playArea.scrollIntoView({ behavior: "smooth", block: "start" });
}

for (const button of buttons) {
  button.addEventListener("click", () => {
    selection[button.dataset.group] = button.dataset.value;
    if (!playArea.hidden) {
      stopVoiceMode();
      window.World.stop();
      playArea.hidden = true;
    }
    render();
  });
}

document.getElementById("play-button").addEventListener("click", startAdventure);
document.getElementById("back-button").addEventListener("click", () => {
  stopVoiceMode();
  window.World.stop();
  playArea.hidden = true;
  document.getElementById("create-heading").scrollIntoView({ behavior: "smooth", block: "start" });
  document.getElementById("play-button").focus({ preventScroll: true });
});
document.getElementById("reset-button").addEventListener("click", () => {
  stopVoiceMode();
  window.World.stop();
  playArea.hidden = true;
  Object.assign(selection, defaults);
  render();
});
document.getElementById("print-button").addEventListener("click", () => window.print());

playScene.addEventListener("pointerdown", (event) => {
  if (event.target.closest(".character, .world-outdoor, .room-scene, .castle-door")) return;
  const bounds = playScene.getBoundingClientRect();
  moveCharacter(document.getElementById("play-hero"), (event.clientX - bounds.left) / bounds.width * 100, (event.clientY - bounds.top) / bounds.height * 100);
  window.World.checkEntrance();
});
document.querySelectorAll("[data-move]").forEach((button) => {
  button.addEventListener("click", () => {
    const hero = document.getElementById("play-hero");
    const directions = { left: [-8, 0], right: [8, 0], up: [0, -8], down: [0, 8] };
    const [dx, dy] = directions[button.dataset.move];
    if (window.World.moveInterior(dx, dy)) return;
    moveCharacter(hero, Number(hero.dataset.x) + dx, Number(hero.dataset.y) + dy);
    window.World.checkEntrance();
  });
});
function addFriend(name) {
  const friendCount = characters.querySelectorAll("[data-added-friend]").length;
  if (friendCount >= 6) {
    document.getElementById("friend-message").textContent = "Your scene is full of friends!";
    return false;
  }
  const friend = friends[name];
  const added = addCharacter(friend.picture, friend.label, 43 + friendCount * 8, 80, false, friend.image);
  added.dataset.addedFriend = "true";
  document.getElementById("friend-message").textContent = "A new friend joined your adventure!";
  return true;
}
document.querySelectorAll("[data-friend]").forEach((button) => {
  button.addEventListener("click", () => addFriend(button.dataset.friend));
});

nextButton.addEventListener("click", () => {
  voiceRetries = 0;
  challengeIndex = (challengeIndex + 1) % challenges[selection.adventure].length;
  renderChallenge();
});

function speakText(text, onEnd) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    stopVoiceMode();
    challengeStatus.textContent = "Reading aloud isn't available here. Try Chrome or Edge, or ask a grown-up to read it.";
    return;
  }
  stopListening();
  stopReading();
  const utterance = new SpeechSynthesisUtterance(text);
  reading = utterance;
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  utterance.onstart = () => {
    if (reading !== utterance) return;
    clearTimeout(readTimer);
    readTimer = setTimeout(() => {
      if (reading !== utterance) return;
      stopVoiceMode();
      challengeStatus.textContent = "Reading aloud stopped unexpectedly. Open in Chrome and check your sound settings.";
    }, Math.max(20000, text.length * 150 + 10000));
    setVoiceState("speaking", "🔊 Speaking");
    challengeStatus.textContent = "Speaking... Check your speakers or volume if you can't hear it.";
  };
  utterance.onend = () => {
    if (reading !== utterance) return;
    clearTimeout(readTimer);
    readTimer = null;
    reading = null;
    onEnd();
  };
  utterance.onerror = () => {
    if (reading !== utterance) return;
    stopVoiceMode();
    challengeStatus.textContent = "Reading aloud didn't work. Check sound settings or try Chrome or Edge.";
  };
  challengeStatus.textContent = "Getting the story ready to read...";
  setVoiceState("speaking", "🔊 Getting ready to speak");
  readTimer = setTimeout(() => {
    if (reading !== utterance) return;
    stopVoiceMode();
    challengeStatus.textContent = "Reading aloud couldn't start. Check sound settings or try Chrome or Edge.";
  }, 5000);
  window.speechSynthesis.resume();
  window.speechSynthesis.speak(utterance);
}

function speakPrompt(prefix = "") {
  if (!voiceMode) return;
  const challenge = challenges[selection.adventure][challengeIndex];
  const prompt = `${prefix} ${challenge.question} You can say: ${challenge.answers.map((answer) => answer.label).join(" or ")}.`;
  speakText(prompt, () => {
    if (voiceMode) startListening();
  });
}

function retryVoice() {
  if (!voiceMode) return;
  voiceRetries++;
  if (voiceRetries <= 2) {
    speakPrompt("I didn't hear that. Let's try again.");
  } else {
    speakText("Let's ask a grown-up for help.", () => {
      stopVoiceMode();
      challengeStatus.textContent = "Voice play stopped after three tries. A grown-up can restart it or choose an answer.";
    });
  }
}

function handleVoiceCommand(transcripts) {
  const text = transcripts.join(" ");
  const move = text.match(/\b(?:move|go)\s+(left|right|up|down)\b/);
  const add = text.match(/\badd\s+(?:(?:a|the)\s+)?(bunny|unicorn|fairy)\b/);
  let reply;
  if (move) {
    const directions = { left: [-8, 0], right: [8, 0], up: [0, -8], down: [0, 8] };
    const [dx, dy] = directions[move[1]];
    const hero = document.getElementById("play-hero");
    if (!window.World.moveInterior(dx, dy)) {
      moveCharacter(hero, Number(hero.dataset.x) + dx, Number(hero.dataset.y) + dy);
      if (window.World.checkEntrance()) {
        reply = "You're inside! Choose the hall, kitchen, dining room, or bedroom.";
      }
    }
    if (!reply) reply = `Let's move ${move[1]}!`;
  } else if (add) {
    reply = addFriend(add[1]) ? `A ${add[1]} joined us!` : "There are lots of friends here already!";
  } else {
    reply = window.World.command(text);
    if (!reply) return false;
  }
  voiceRetries = 0;
  speakText(reply, () => speakPrompt());
  return true;
}

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    stopVoiceMode();
    challengeStatus.textContent = "Voice answers aren't available here. Open this page in Chrome or Edge, or click an answer.";
    return;
  }
  if (answered) {
    challengeStatus.textContent = "Wonderful! Tap Next adventure to keep playing.";
    return;
  }
  stopReading();
  stopListening();
  const session = {};
  listeningSession = session;
  challengeStatus.textContent = "Starting the microphone...";
  setVoiceState("off", "🎙️ Starting microphone");
  voiceButton.disabled = true;
  voiceButton.textContent = "🎙️ Listening...";
  listeningTimer = setTimeout(() => {
    if (listeningSession !== session) return;
    stopListening();
    if (voiceMode) retryVoice();
    else {
      setVoiceState("off", "○ Voice is off");
      challengeStatus.textContent = "I didn't hear an answer. Try again or click an answer.";
    }
  }, 30000);

  function startRecognizer() {
    if (listeningSession !== session) return;
    const listener = new SpeechRecognition();
    recognition = listener;
    listener.lang = "en-US";
    listener.interimResults = true;
    listener.maxAlternatives = 3;
    let fatalError = false;
    listener.onstart = () => {
      if (recognition !== listener) return;
      setVoiceState("listening", "🎙️ Listening — say something!");
      challengeStatus.textContent = "Listening... say one of the answers!";
    };
    listener.onspeechstart = () => {
      if (recognition !== listener) return;
      setVoiceState("listening", "🎙️ I hear you!");
    };
    listener.onresult = (event) => {
      if (recognition !== listener) return;
      const result = event.results[event.resultIndex];
      if (!result.isFinal) {
        setVoiceState("listening", `🎙️ Hearing: ${result[0].transcript}`);
        return;
      }
      const challenge = challenges[selection.adventure][challengeIndex];
      const transcripts = Array.from(result, (alternative) => alternative.transcript.toLowerCase().replace(/[^a-z ]/g, " "));
      setVoiceState("listening", `🎙️ Heard: ${result[0].transcript}`);
      const answer = challenge.answers.find((option) => option.words.some((word) => transcripts.some((text) => (` ${text} `).includes(` ${word} `))));
      if (answer) {
        answerChallenge(answer);
      } else if (!(voiceMode && handleVoiceCommand(transcripts))) {
        challengeStatus.textContent = "I'm still listening. Try saying one of the answers!";
      }
    };
    listener.onerror = (event) => {
      if (recognition !== listener) return;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        fatalError = true;
        challengeStatus.textContent = "Microphone access was blocked. Ask a grown-up to allow it in browser and computer settings, or click an answer.";
      } else if (event.error === "network") {
        fatalError = true;
        challengeStatus.textContent = "The browser's speech service couldn't connect. If you're in VS Code, open this page in Google Chrome; check your internet connection and microphone settings.";
      } else if (event.error === "audio-capture") {
        fatalError = true;
        challengeStatus.textContent = "No microphone was found. Check your microphone or click an answer.";
      } else if (event.error !== "no-speech") {
        fatalError = true;
        challengeStatus.textContent = "The microphone encountered an error. Ask a grown-up to try again or click an answer.";
      }
      if (fatalError) {
        const errorMessage = challengeStatus.textContent;
        const wasVoiceMode = voiceMode;
        stopVoiceMode();
        if (wasVoiceMode) {
          speakText("Oh dear, I can't hear you. Please ask a grown-up for help.", () => {
            challengeStatus.textContent = errorMessage;
          });
        }
        challengeStatus.textContent = errorMessage;
      }
    };
    listener.onend = () => {
      if (recognition !== listener) return;
      recognition = null;
      if (listeningSession !== session || fatalError) return;
      setVoiceState("listening", "🎙️ Still listening...");
      restartTimer = setTimeout(startRecognizer, 300);
    };
    try {
      listener.start();
    } catch (error) {
      recognition = null;
      stopVoiceMode();
      challengeStatus.textContent = "The microphone couldn't start. Check your browser settings or click an answer.";
      console.error("Speech recognition could not start:", error);
    }
  }
  startRecognizer();
}

voiceModeButton.addEventListener("click", () => {
  if (voiceMode) {
    stopVoiceMode();
    challengeStatus.textContent = "Hands-free play is off. The microphone is stopped.";
    return;
  }
  if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) {
    stopReading();
    challengeStatus.textContent = "Hands-free play needs speech recognition. Try Chrome or Edge.";
    return;
  }
  stopListening();
  stopReading();
  voiceMode = true;
  voiceRetries = 0;
  if (answered) {
    challengeIndex = 0;
    answered = false;
  }
  voiceModeButton.setAttribute("aria-pressed", "true");
  voiceModeButton.textContent = "■ Stop voice";
  readButton.disabled = true;
  voiceButton.disabled = true;
  renderChallenge("Welcome! You can say move right, plant a seed, or open the castle.");
});

voiceButton.addEventListener("click", startListening);
readButton.addEventListener("click", () => {
  const challenge = challenges[selection.adventure][challengeIndex];
  speakText(`${challenge.question} You can say: ${challenge.answers.map((answer) => answer.label).join(" or ")}.`, () => {
    setVoiceState("off", "○ Voice is off");
    challengeStatus.textContent = "Your turn! Say or click an answer.";
  });
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && (voiceMode || listeningSession)) {
    stopVoiceMode();
    challengeStatus.textContent = "Hands-free play stopped when the page was hidden. A grown-up can start it again.";
  } else if (!document.hidden) updateSeason();
});
window.addEventListener("pagehide", stopVoiceMode);
setInterval(() => {
  if (window.World && !playArea.hidden) window.World.tick();
  else updateSeason();
}, 1000);
render();
updateSeason();
