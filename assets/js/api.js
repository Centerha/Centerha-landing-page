/**
 * Centerha API client (public endpoints only, no auth).
 *
 * Response shape of GET /api/home/landing:
 *
 * @typedef {Object} LandingStats
 * @property {number} cities      Governorates with at least one facility.
 * @property {number} facilities  Total facilities.
 * @property {number} fields      Total active fields.
 * @property {number} bookings    Total confirmed bookings.
 *
 * @typedef {Object} LandingCity
 * @property {string} governorate     Governorate enum code (e.g. "DAMASCUS").
 * @property {number} facilitiesCount
 * @property {number} fieldsCount
 *
 * @typedef {Object} LandingCategory
 * @property {string} pitchSize   PitchSize enum code (e.g. "FIVE_A_SIDE").
 * @property {number} fieldsCount
 *
 * @typedef {Object} LandingFieldCard
 * @property {string} fieldId
 * @property {string} fieldName
 * @property {string} facilityId
 * @property {string} facilityName
 * @property {string} governorate    Governorate enum code.
 * @property {string} pitchSize      PitchSize enum code.
 * @property {string} price          Decimal string, e.g. "70000.00".
 * @property {string} currency       e.g. "SYP".
 * @property {string|null} mainImageUrl
 *
 * @typedef {Object} LandingFacilityCard
 * @property {string} id
 * @property {string} name
 * @property {string} governorate    Governorate enum code.
 * @property {string|null} imageUrl
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} activeFieldsCount
 *
 * @typedef {Object} LandingBanner
 * @property {string} id
 * @property {string} imageUrl
 * @property {string|null} title
 * @property {boolean} hasAction
 * @property {string|null} actionType    "INTERNAL" | "EXTERNAL" | null.
 * @property {string|null} actionTarget
 * @property {number} sortOrder
 *
 * @typedef {Object} LandingContentPage
 * @property {string} slug
 * @property {string} type
 * @property {string} titleAr
 * @property {string} titleEn
 *
 * @typedef {Object} LandingResponse
 * @property {LandingStats} stats
 * @property {LandingCity[]} cities
 * @property {LandingCategory[]} categories
 * @property {LandingFieldCard[]} featuredFields
 * @property {LandingFieldCard[]} recentFields
 * @property {LandingFacilityCard[]} recentFacilities
 * @property {LandingBanner[]} banners
 * @property {LandingContentPage[]} contentPages
 * @property {{governorates: string[], pitchSizes: string[]}} searchMetadata
 */
window.CenterhaApi = (function () {
  "use strict";

  var DEFAULT_TIMEOUT_MS = 12000;

  /**
   * GET a public JSON endpoint with a hard timeout.
   * @param {string} path Path under the API base URL, e.g. "/home/landing".
   * @returns {Promise<any>} Parsed JSON body; rejects on network/HTTP errors.
   */
  function getJson(path) {
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = controller
      ? setTimeout(function () { controller.abort(); }, DEFAULT_TIMEOUT_MS)
      : null;

    return fetch(window.CenterhaConfig.API_BASE_URL + path, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("API responded with HTTP " + response.status);
        }
        return response.json();
      })
      .finally(function () {
        if (timer) clearTimeout(timer);
      });
  }

  /**
   * Resolve a media URL returned by the API. Absolute URLs pass through;
   * server-relative paths (e.g. "/api/uploads/...") are resolved against the
   * API origin. Returns null for anything unusable.
   * @param {string|null|undefined} url
   * @returns {string|null}
   */
  function resolveMediaUrl(url) {
    if (!url || typeof url !== "string") return null;
    if (/^https:\/\//i.test(url)) return url;
    if (/^http:\/\//i.test(url)) {
      // Allow http only for local development APIs.
      return /^http:\/\/(localhost|127\.0\.0\.1)/i.test(url) ? url : null;
    }
    if (url.charAt(0) === "/") return window.CenterhaConfig.API_ORIGIN + url;
    return null;
  }

  /**
   * Build a query string from a params object, skipping empty values.
   * @param {Object} params
   * @returns {string} "?a=b&c=d" or "" when nothing is set.
   */
  function toQueryString(params) {
    var pairs = [];
    Object.keys(params || {}).forEach(function (key) {
      var value = params[key];
      if (value === undefined || value === null || value === "") return;
      pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(value)));
    });
    return pairs.length ? "?" + pairs.join("&") : "";
  }

  return {
    /** @returns {Promise<LandingResponse>} */
    fetchLanding: function () {
      return getJson("/home/landing");
    },
    /**
     * Public catalog browse/search (GET /api/catalog/public — no auth).
     *
     * @param {Object} params
     * @param {string}  [params.q]           Keyword (field/facility name, 1–100 chars).
     * @param {string}  [params.governorate] Governorate enum code.
     * @param {string}  [params.pitchSize]   PitchSize enum code.
     * @param {number}  [params.page]        1-indexed page (default 1).
     * @param {number}  [params.limit]       Page size (max 50, default 12).
     * @param {string}  [params.view]        "FIELDS" (default) or "FACILITIES".
     * @returns {Promise<{items: Array, total: number, page: number, limit: number,
     *   totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean}>}
     */
    searchCatalog: function (params) {
      return getJson("/catalog/public" + toQueryString(params));
    },
    /**
     * Public field detail (GET /api/fields/:id — no auth, active fields only).
     * @param {string} fieldId
     * @returns {Promise<{id:string, facilityId:string, facilityName:string,
     *   facilityImageUrl:string|null, name:string, governorate:string,
     *   latitude:number, longitude:number, pitchSize:string,
     *   slotDurationMinutes:number, price:string, currency:string,
     *   hasMinimumDeposit:boolean, minimumDepositAmount:string|null,
     *   description:string|null, status:string,
     *   images:Array<{id:string,url:string,order:number,isMain:boolean}>}>}
     */
    fetchFieldDetail: function (fieldId) {
      return getJson("/fields/" + encodeURIComponent(fieldId));
    },
    /**
     * Public availability for all fields of a facility, next 14 days
     * (GET /api/facilities/:facilityId/slots — real booking/block logic).
     * @param {string} facilityId
     * @returns {Promise<Array<{fieldId:string, fieldName:string,
     *   dailySlots:Array<{date:string, slots:Array<{slotId:string,
     *   startTime:string, endTime:string, price:string,
     *   isAvailable:boolean, status:string}>}>}>>}
     */
    fetchFacilitySlots: function (facilityId) {
      return getJson("/facilities/" + encodeURIComponent(facilityId) + "/slots");
    },
    /**
     * @param {string} slug Content page slug (e.g. "privacy-policy").
     * @returns {Promise<{slug:string,type:string,titleAr:string,titleEn:string,contentAr:string,contentEn:string}>}
     */
    fetchContentPage: function (slug) {
      return getJson("/content/" + encodeURIComponent(slug));
    },
    resolveMediaUrl: resolveMediaUrl
  };
})();
