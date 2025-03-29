// Define interface for the VolumeControlUI
interface VolumeControlUIInterface {
  createVolumeControl: (
    lastVolume: number,
    onVolumeChange: (e: Event) => void,
    onFirstInteraction: () => void
  ) => HTMLDivElement;
  insertVolumeControl: (volumeControl: HTMLDivElement) => boolean;
}

// Extend Window interface to include our global properties
declare global {
  interface Window {
    volumeControlObserver?: MutationObserver;
    VolumeControlUI: VolumeControlUIInterface;
  }
}

// UI-related constants and functions for volume control
const VolumeControlUI: VolumeControlUIInterface = {
  createVolumeControl(
    lastVolume: number,
    onVolumeChange: (e: Event) => void,
    onFirstInteraction: () => void
  ): HTMLDivElement {
    const volumeControl = document.createElement("div");
    volumeControl.className = "custom-volume-control";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = lastVolume.toString();
    slider.className = "custom-volume-slider";

    // Add volume percentage display
    const volumeDisplay = document.createElement("span");
    volumeDisplay.className = "volume-display";
    volumeDisplay.textContent = `${Math.round(lastVolume)}%`;
    volumeDisplay.style.marginLeft = "8px";
    volumeDisplay.style.fontSize = "12px";
    volumeDisplay.style.color = "rgba(255, 255, 255, 0.7)";
    volumeDisplay.style.minWidth = "30px";

    volumeControl.appendChild(slider);
    volumeControl.appendChild(volumeDisplay);

    // Prevent click events from propagating up
    volumeControl.addEventListener("click", (e) => e.stopPropagation());
    volumeControl.addEventListener("mousedown", (e) => e.stopPropagation());

    // Handle volume changes
    slider.addEventListener("input", (e) => {
      onVolumeChange(e);
      // Update display
      const target = e.target as HTMLInputElement;
      volumeDisplay.textContent = `${Math.round(parseFloat(target.value))}%`;
    });

    // Initialize audio context on first user interaction
    slider.addEventListener("mousedown", onFirstInteraction);

    return volumeControl;
  },

  insertVolumeControl(volumeControl: HTMLDivElement): boolean {
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

// Assign to window object
window.VolumeControlUI = VolumeControlUI;

export default VolumeControlUI;
