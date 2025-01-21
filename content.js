// Function to enhance volume control
let lastVolume = null; // Store last volume globally

function enhanceVolumeControl() {
  // Find the volume slider
  const volumeSlider = document.querySelector(
    "tp-yt-paper-slider#volume-slider"
  );

  if (volumeSlider) {
    let isAdjusting = false;

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

      // Store the raw value for future reference
      lastVolume = rawValue;

      // More aggressive logarithmic scaling for better low-volume control
      const scaledValue = Math.pow(rawValue / 100, 3) * 100;

      // Find and update the media element volume
      const mediaElement = document.querySelector("video, audio");
      if (mediaElement) {
        mediaElement.volume = scaledValue / 100;
      }

      // Ensure the slider UI reflects the correct value
      if (volumeSlider.value !== rawValue) {
        volumeSlider.value = rawValue;
      }

      isAdjusting = false;
    }

    // If we have a stored volume, apply it
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
      mediaElement.addEventListener("volumechange", () => {
        if (!isAdjusting && lastVolume !== null) {
          // If volume changed externally, reapply our stored volume
          applyCustomVolume(lastVolume, true);
        }
      });
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
