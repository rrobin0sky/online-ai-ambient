/**
 * Browser environment utility functions
 */

/**
 * Checks whether the current window is running inside an iframe, webview, or cross-origin subframe.
 * The W3C File System Access API (showDirectoryPicker) strictly requires a top-level browsing context.
 */
export function isSubframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true; // Accessing window.top threw cross-origin security exception -> definitely subframe
  }
}

/**
 * Opens current URL in a clean top-level browser tab
 */
export function openInTopLevel(): void {
  try {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  } catch {
    window.open('https://ambient.bin0sky.tech', '_blank');
  }
}
