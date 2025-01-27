// UI-related constants and functions for volume control
window.VolumeControlUI = {
  createVolumeControl(lastVolume, onVolumeChange, onFirstInteraction) {
    const volumeControl = document.createElement("div");
    volumeControl.className = "custom-volume-control";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = lastVolume;
    slider.className = "custom-volume-slider";

    volumeControl.appendChild(slider);

    // Prevent click events from propagating up
    volumeControl.addEventListener("click", (e) => e.stopPropagation());
    volumeControl.addEventListener("mousedown", (e) => e.stopPropagation());

    // Handle volume changes
    slider.addEventListener("input", onVolumeChange);

    // Initialize audio context on first user interaction
    slider.addEventListener("mousedown", onFirstInteraction);

    return volumeControl;
  },

  insertVolumeControl(volumeControl) {
    const targetElement = document.querySelector(
      "tp-yt-paper-slider#volume-slider"
    );
    if (targetElement && targetElement.parentElement) {
      const volumeIcon =
        targetElement.parentElement.querySelector("#volume-icon");
      if (volumeIcon) {
        volumeIcon.insertAdjacentElement("afterend", volumeControl);
        return true;
      } else {
        targetElement.parentElement.insertBefore(volumeControl, targetElement);
        return true;
      }
    }
    return false;
  },
};
