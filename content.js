// Function to enhance volume control
let lastVolume = parseFloat(localStorage.getItem("ytMusicVolume")) || null; // Get stored volume
let isAdjusting = false;
const VOLUME_THRESHOLD = 0.001; // Increase threshold to 0.1%

// Function to ensure volume is set correctly
function ensureVolumeIsSet() {
  const mediaElement = document.querySelector("video, audio");
  if (mediaElement && lastVolume !== null && !isAdjusting) {
    const scaledValue = Math.pow(lastVolume / 100, 3) * 100;
    const targetVolume = scaledValue / 100;

    if (Math.abs(mediaElement.volume - targetVolume) > VOLUME_THRESHOLD) {
      mediaElement.volume = targetVolume;
    }
  }
}

function enhanceVolumeControl() {
  // Find the volume slider
  const volumeSlider = document.querySelector(
    "tp-yt-paper-slider#volume-slider"
  );

  if (volumeSlider) {
    // Make steps smaller for finer control
    volumeSlider.setAttribute("step", "0.1");
    volumeSlider.setAttribute("aria-valuemin", "0");
    volumeSlider.setAttribute("aria-valuemax", "100");

    // Add custom styling to make the slider wider
    const style = document.createElement("style");
    style.textContent = `
      tp-yt-paper-slider#volume-slider {
        width: 150px !important;
      }
    `;
    document.head.appendChild(style);

    // Function to apply custom volume scaling
    function applyCustomVolume(rawValue, force = false) {
      if (isAdjusting && !force) return;

      isAdjusting = true;
      try {
        // Store the raw value for future reference
        lastVolume = rawValue;
        localStorage.setItem("ytMusicVolume", rawValue.toString());

        // More aggressive logarithmic scaling for better low-volume control
        const scaledValue = Math.pow(rawValue / 100, 2) * 100;

        // Find and update the media element volume
        const mediaElement = document.querySelector("video, audio");
        if (mediaElement) {
          mediaElement.volume = scaledValue / 100;
        }

        // Ensure the slider UI reflects the correct value
        if (volumeSlider.value !== rawValue) {
          volumeSlider.value = rawValue;
        }
      } finally {
        isAdjusting = false;
      }
    }

    // Apply stored volume immediately when controls are ready
    if (lastVolume !== null) {
      applyCustomVolume(lastVolume, true);
    }

    // Listen for both immediate changes and final value changes
    volumeSlider.addEventListener("immediate-value-changed", (e) => {
      applyCustomVolume(e.detail.value);
    });

    volumeSlider.addEventListener("value-changed", (e) => {
      applyCustomVolume(e.detail.value);
    });

    // Also intercept the click events on the slider
    volumeSlider.addEventListener("click", () => {
      const value = volumeSlider.getAttribute("value");
      if (value) {
        applyCustomVolume(parseFloat(value));
      }
    });

    // Monitor the video element for volume changes
    const mediaElement = document.querySelector("video, audio");
    if (mediaElement) {
      // Monitor for source changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "src"
          ) {
            ensureVolumeIsSet();
          }
        });
      });

      observer.observe(mediaElement, {
        attributes: true,
        attributeFilter: ["src"],
      });

      mediaElement.addEventListener("volumechange", () => {
        if (!isAdjusting && lastVolume !== null) {
          ensureVolumeIsSet();
        }
      });

      // Also monitor for play events
      mediaElement.addEventListener("play", ensureVolumeIsSet);
      mediaElement.addEventListener("loadeddata", ensureVolumeIsSet);
      mediaElement.addEventListener("canplay", ensureVolumeIsSet);
    }
  }
}

// Run the enhancement when the page loads
enhanceVolumeControl();

// Create a more robust observer that waits for the player to be ready
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      const volumeSlider = document.querySelector(
        "tp-yt-paper-slider#volume-slider"
      );
      if (volumeSlider) {
        enhanceVolumeControl();
        break;
      }
    }
  }
});

// Start observing the document for changes
observer.observe(document.body, {
  childList: true,
  subtree: true,
});
