const choices = {
  hero: {
    princess: { picture: "👸", story: "A princess" },
    fairy: { picture: "🧚", story: "A fairy" },
    unicorn: { picture: "🦄", story: "A unicorn" },
  },
  place: {
    castle: { picture: "🏰", story: "a magical castle" },
    garden: { picture: "🌷", story: "a magical garden" },
    clouds: { picture: "☁️", story: "the fluffy clouds" },
  },
  adventure: {
    treasure: { picture: "💎", story: "find treasure" },
    friends: { picture: "🐰", story: "make new friends" },
    party: { picture: "🎈", story: "have a party" },
  },
};

const defaults = { hero: "princess", place: "castle", adventure: "treasure" };
const selection = { ...defaults };
const buttons = document.querySelectorAll(".choice");

function render() {
  for (const button of buttons) {
    const selected = selection[button.dataset.group] === button.dataset.value;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  }

  for (const group of Object.keys(selection)) {
    document.getElementById(`scene-${group}`).textContent = choices[group][selection[group]].picture;
  }

  document.getElementById("story-text").textContent =
    `${choices.hero[selection.hero].story} sets off to ${choices.adventure[selection.adventure].story} in ${choices.place[selection.place].story}!`;
}

for (const button of buttons) {
  button.addEventListener("click", () => {
    selection[button.dataset.group] = button.dataset.value;
    render();
  });
}

document.getElementById("reset-button").addEventListener("click", () => {
  Object.assign(selection, defaults);
  render();
});

document.getElementById("print-button").addEventListener("click", () => window.print());
