(() => {
  const install = document.getElementById("install-app");
  const status = document.getElementById("app-status");
  const installHelp = document.getElementById("install-help");
  const challenge = document.getElementById("challenge-dialog");
  const challengeOpen = document.getElementById("challenge-open");
  const voiceModeControl = document.getElementById("voice-mode-button");
  const voiceIndicator = document.getElementById("voice-indicator");
  const challengeVoiceState = document.getElementById("challenge-voice-state");
  const voiceSummaryState = document.getElementById("voice-summary-state");
  const challengeStopVoice = document.getElementById("challenge-stop-voice");
  const toolsPanel = document.getElementById("tools-panel");
  const voicePanel = document.querySelector(".voice-panel");
  let installPrompt = null;
  let challengeReturnFocus = null;

  startAdventure();
  for (const panel of [toolsPanel, voicePanel]) {
    panel.addEventListener("toggle", () => {
      if (panel.open) (panel === toolsPanel ? voicePanel : toolsPanel).open = false;
    });
  }
  toolsPanel.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || (!button.matches("[data-garden-tool], [data-world], [data-friend]"))) return;
    toolsPanel.open = false;
    const target = button.matches("[data-garden-tool]") ? document.querySelector("#garden-plots button") : toolsPanel.querySelector("summary");
    if (target) target.focus({ preventScroll: true });
  });
  function openChallenge() {
    if (!challenge.open) {
      challengeReturnFocus = document.activeElement;
      challenge.showModal();
    }
  }
  challengeOpen.addEventListener("click", openChallenge);
  document.getElementById("challenge-close").addEventListener("click", () => challenge.close());
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && challenge.open) {
      event.preventDefault();
      challenge.close();
    }
  });
  challenge.addEventListener("close", () => {
    if (challengeReturnFocus instanceof HTMLElement && challengeReturnFocus.isConnected) challengeReturnFocus.focus();
  });
  voiceModeControl.addEventListener("click", () => {
    if (voiceMode || challengeStatus.textContent.includes("needs speech recognition")) openChallenge();
  });
  challengeStopVoice.addEventListener("click", () => voiceModeControl.click());
  function syncVoiceDisplay() {
    const active = voiceIndicator.dataset.state !== "off";
    challengeVoiceState.textContent = active ? voiceIndicator.textContent : "";
    voiceSummaryState.textContent = active ? `— ${voiceIndicator.textContent}` : "";
    challengeStopVoice.hidden = !voiceMode;
  }
  new MutationObserver(syncVoiceDisplay).observe(voiceIndicator, { attributes: true, childList: true, subtree: true, characterData: true });
  new MutationObserver(syncVoiceDisplay).observe(voiceModeControl, { attributes: true, attributeFilter: ["aria-pressed"] });
  syncVoiceDisplay();
  function enableAudio() {
    document.removeEventListener("pointerdown", enableAudio);
    document.removeEventListener("keydown", enableAudio);
    window.World.enableAudio();
  }
  document.addEventListener("pointerdown", enableAudio);
  document.addEventListener("keydown", enableAudio);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    install.hidden = false;
  });
  install.addEventListener("click", async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      status.textContent = choice.outcome === "accepted" ? "The app is ready to install." : "You can install it later.";
    } catch (error) {
      console.error("Could not start installation:", error);
      status.textContent = "Installation could not start. Try your browser's install or add-to-home-screen menu.";
    } finally {
      installPrompt = null;
      install.hidden = true;
    }
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    install.hidden = true;
    status.textContent = "Princess Athena is installed!";
  });

  if ("serviceWorker" in navigator && window.isSecureContext) {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.error("Could not enable offline play:", error);
      status.textContent = "Offline play could not be enabled. Check the connection and reload.";
    });
  } else {
    installHelp.textContent = "For installation and offline play, open this app on localhost or HTTPS.";
  }
})();
