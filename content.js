// Function to enhance volume control
let lastVolume = parseFloat(localStorage.getItem("ytMusicVolume")) || 100;
let audioContext = null;
let gainNode = null;
let isInitialized = false;
let isControlCreated = false;

// Initialize audio processing
async function initializeAudioContext() {
  if (isInitialized) return;

  const mediaElement = document.querySelector("video, audio");
  if (!mediaElement) {
    console.log("No media element found yet");
    return;
  }

  try {
    // Wait for user interaction before creating AudioContext
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      await audioContext.resume();
    }

    const source = audioContext.createMediaElementSource(mediaElement);
    gainNode = audioContext.createGain();

    // Connect the audio nodes
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set initial volume
    const scaledValue = Math.pow(lastVolume / 100, 3.5);
    gainNode.gain.value = scaledValue;

    isInitialized = true;
    console.log("Audio context initialized successfully");
  } catch (error) {
    console.error("Error initializing audio context:", error);
    // Reset state on error
    isInitialized = false;
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
      const scaledValue = value === 0 ? 0 : Math.pow(value / 100, 2);
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
  // Wait for a short delay to ensure the page is ready
  setTimeout(async () => {
    createCustomVolumeControl();
    // Initialize audio context and set volume immediately
    await initializeAudioContext();
    if (gainNode && audioContext) {
      const scaledValue = Math.pow(lastVolume / 100, 2);
      gainNode.gain.setTargetAtTime(
        scaledValue,
        audioContext.currentTime,
        0.01
      );
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
