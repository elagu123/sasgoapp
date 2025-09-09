
/**
 * Mock telemetry service. In a real app, this would send data to an analytics service.
 * @param {string} eventName - The name of the event.
 * @param {object} [payload] - Optional data to send with the event.
 */
export function trackEvent(eventName, payload) {
  console.log(`[TELEMETRY] Event: ${eventName}`, payload || '');
}
