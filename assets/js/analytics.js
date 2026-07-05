/**
 * Centerha analytics abstraction.
 *
 * No external service is wired here — events are re-emitted as a DOM
 * CustomEvent ('centerha:analytics') so any future collector (self-hosted or
 * third-party) can subscribe without changing call sites.
 *
 * PRIVACY RULES (enforced by convention at every call site):
 *   - never include tokens, phone numbers, user names, or emails
 *   - only anonymous product identifiers (fieldId, slugs, enum codes) and
 *     coarse UI context are allowed in payloads
 *
 * Event names in use:
 *   landing_view, search_submitted, search_result_clicked,
 *   field_detail_viewed, booking_cta_clicked, owner_cta_clicked,
 *   language_changed, content_page_opened
 */
window.centerhaTrack = function (eventName, payload) {
  try {
    window.dispatchEvent(
      new CustomEvent("centerha:analytics", {
        detail: { eventName: String(eventName), payload: payload || {} }
      })
    );
  } catch (e) {
    /* analytics must never break the page */
  }
};
