// Function to enhance volume control
let lastVolume = parseFloat(localStorage.getItem("ytMusicVolume")) || 100;
let audioContext = null;
let gainNode = null;
let isInitialized = false;
let isControlCreated = false;
let currentMediaElement = null;

// Initialize audio processing
async function initializeAudioContext() {
  const mediaElement = document.querySelector("video, audio");
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
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
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

function createCustomVolumeControl() {
  if (isControlCreated) return;

  // Remove any existing custom controls first
  const existingControls = document.querySelectorAll(".custom-volume-control");
  existingControls.forEach((control) => control.remove());

  // Hide YouTube's volume control
  const style = document.createElement("style");
  style.textContent = `
    tp-yt-paper-slider#volume-slider {
      display: none !important;
    }
    
    .custom-volume-control {
      width: 150px;
      height: 24px;
      display: flex;
      align-items: center;
      margin-right: 8px;
      position: relative;
    }
    
    .custom-volume-slider {
      -webkit-appearance: none;
      appearance: none;
      background: transparent;
      width: 150px;
      height: 24px;
      padding: 0;
      margin: 0;
    }
    
    .custom-volume-slider::-webkit-slider-runnable-track {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      border: none;
    }
    
    .custom-volume-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 12px;
      height: 12px;
      background: white;
      border-radius: 50%;
      margin-top: -4px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  // Create our custom volume control
  const volumeControl = document.createElement("div");
  volumeControl.className = "custom-volume-control";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = "100";
  slider.value = lastVolume;
  slider.className = "custom-volume-slider";

  volumeControl.appendChild(slider);

  // Prevent click events from propagating up to prevent player UI show/hide
  volumeControl.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  volumeControl.addEventListener("mousedown", (e) => {
    e.stopPropagation();
  });

  // Find the correct insertion point
  const targetElement = document.querySelector(
    "tp-yt-paper-slider#volume-slider"
  );
  if (targetElement && targetElement.parentElement) {
    // Get the volume icon element
    const volumeIcon =
      targetElement.parentElement.querySelector("#volume-icon");
    if (volumeIcon) {
      // Insert after the volume icon
      volumeIcon.insertAdjacentElement("afterend", volumeControl);
    } else {
      // Fallback to original placement
      targetElement.parentElement.insertBefore(volumeControl, targetElement);
    }
    isControlCreated = true;
  }

  // Handle volume changes
  slider.addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);
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
  });

  // Initialize audio context on first user interaction
  slider.addEventListener("mousedown", () => {
    if (!isInitialized) {
      initializeAudioContext();
    }
  });

  return volumeControl;
}

// Initialize when the page loads
function initialize() {
  setTimeout(async () => {
    createCustomVolumeControl();
    await initializeAudioContext();

    const mediaObserver = new MutationObserver(async (mutations) => {
      const mediaElement = document.querySelector("video, audio");
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
