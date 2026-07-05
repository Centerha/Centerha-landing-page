/**
 * Centerha site configuration.
 *
 * Single source of truth for the API base URL — do not hardcode API URLs
 * anywhere else. Override order:
 *   1. window.CENTERHA_API_BASE_URL (set it in a <script> BEFORE config.js
 *      to point any deployment at a different API, e.g. staging).
 *   2. localhost / 127.0.0.1 / file:// -> local development backend.
 *   3. Production API.
 */
window.CenterhaConfig = (function () {
  "use strict";

  var host = window.location.hostname;
  var isLocal = host === "localhost" || host === "127.0.0.1" || host === "";

  var apiBaseUrl =
    window.CENTERHA_API_BASE_URL ||
    (isLocal ? "http://localhost:3000/api" : "https://api.centerha.software/api");

  // Origin (no /api suffix) used to resolve relative media/upload paths.
  var apiOrigin = apiBaseUrl.replace(/\/api\/?$/, "");

  return {
    API_BASE_URL: apiBaseUrl,
    API_ORIGIN: apiOrigin
  };
})();
