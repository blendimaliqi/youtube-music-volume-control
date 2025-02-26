import VolumeControlUI from "./volumeControlUI";

// Function to enhance volume control
let lastVolume: number = parseFloat(
  localStorage.getItem("ytMusicVolume") || "100"
);
let audioContext: AudioContext | null = null;
let gainNode: GainNode | null = null;
let isInitialized: boolean = false;
let isControlCreated: boolean = false;
let currentMediaElement: HTMLMediaElement | null = null;

// Define type for our window extension
declare global {
  interface Window {
    volumeControlObserver?: MutationObserver;
  }
}

// Initialize audio processing
async function initializeAudioContext(): Promise<void> {
  const mediaElement = document.querySelector<HTMLMediaElement>("video, audio");
  if (!mediaElement) {
    console.log("No media element found yet");
    return;
  }

  // Check if we need to reinitialize due to new media element
  if (currentMediaElement && currentMediaElement !== mediaElement) {
    // Clean up old connections
    if (gainNode) {
      gainNode.disconnect();
    }
    isInitialized = false;
  }

  try {
    // Initialize if not initialized or if media element changed
    if (!isInitialized) {
      // Create new AudioContext if needed
      if (!audioContext || audioContext.state === "closed") {
        audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        await audioContext.resume();
      }

      const source = audioContext.createMediaElementSource(mediaElement);
      gainNode = audioContext.createGain();

      // Connect the audio nodes
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set initial volume with cubic scaling
      const scaledValue = Math.pow(lastVolume / 100, 3) * 3;
      gainNode.gain.value = scaledValue;

      currentMediaElement = mediaElement;
      isInitialized = true;
      console.log("Audio context initialized successfully");
    }
  } catch (error) {
    console.error("Error initializing audio context:", error);
    // Reset state on error
    isInitialized = false;
    currentMediaElement = null;
    audioContext = null;
    gainNode = null;
  }
}

function createCustomVolumeControl(): HTMLDivElement | undefined {
  if (isControlCreated) return;

  // Remove any existing custom controls first
  const existingControls = document.querySelectorAll<HTMLDivElement>(
    ".custom-volume-control"
  );
  existingControls.forEach((control) => control.remove());

  // Handle volume changes
  const onVolumeChange = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    const value = parseFloat(target.value);
    lastVolume = value;
    localStorage.setItem("ytMusicVolume", value.toString());

    if (gainNode && audioContext) {
      const scaledValue = value === 0 ? 0 : Math.pow(value / 100, 3) * 3;
      gainNode.gain.setTargetAtTime(
        scaledValue,
        audioContext.currentTime,
        0.01
      );
    }
  };

  // Handle first interaction
  const onFirstInteraction = (): void => {
    if (!isInitialized) {
      initializeAudioContext();
    }
  };

  const volumeControl = VolumeControlUI.createVolumeControl(
    lastVolume,
    onVolumeChange,
    onFirstInteraction
  );

  if (VolumeControlUI.insertVolumeControl(volumeControl)) {
    isControlCreated = true;
  }

  return volumeControl;
}

// Initialize when the page loads
function initialize(): void {
  setTimeout(async () => {
    createCustomVolumeControl();
    await initializeAudioContext();

    const mediaObserver = new MutationObserver(async () => {
      const mediaElement =
        document.querySelector<HTMLMediaElement>("video, audio");
      if (mediaElement && mediaElement !== currentMediaElement) {
        await initializeAudioContext();
      }
    });

    // Observe changes to the player container
    const playerContainer = document.querySelector("#movie_player");
    if (playerContainer) {
      mediaObserver.observe(playerContainer, {
        childList: true,
        subtree: true,
      });
    }
  }, 1000);
}

// Disconnect previous observer if it exists
if (window.volumeControlObserver) {
  window.volumeControlObserver.disconnect();
}

// Wait for the player to be ready
window.volumeControlObserver = new MutationObserver((mutations) => {
  if (!isControlCreated) {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        const volumeSlider = document.querySelector(
          "tp-yt-paper-slider#volume-slider"
        );
        if (volumeSlider) {
          initialize();
          break;
        }
      }
    }
  }
});

// Start observing the document for changes
window.volumeControlObserver.observe(document.body, {
  childList: true,
  subtree: true,
});
