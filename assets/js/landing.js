/**
 * Landing page live-data rendering.
 *
 * Fetches GET /api/home/landing (see api.js for the response shape) and fills:
 *   - hero meta line          (#heroMeta)
 *   - stats strip             (#liveStatsSec / #liveStatsGrid)
 *   - explore section         (#explore: banners, filters, pitches, venues,
 *                              cities, categories + loading/error/empty states)
 *   - footer content links    (#footerCompanyLinks)
 *
 * All API strings are inserted via textContent (never innerHTML) so backend
 * data can never inject markup. Bilingual text uses the site's data-en/data-ar
 * spans, which the CSS toggles automatically on language switch — only
 * <select> options need re-labelling, handled via `centerha:languagechange`.
 */
(function () {
  "use strict";

  /* ---------- localized enum label maps (UI labels only, not data) ---------- */

  var GOVERNORATE_LABELS = {
    DAMASCUS: { en: "Damascus", ar: "دمشق" },
    ALEPPO: { en: "Aleppo", ar: "حلب" },
    HOMS: { en: "Homs", ar: "حمص" },
    HAMA: { en: "Hama", ar: "حماة" },
    LATAKIA: { en: "Latakia", ar: "اللاذقية" },
    TARTOUS: { en: "Tartous", ar: "طرطوس" },
    IDLIB: { en: "Idlib", ar: "إدلب" },
    DEIR_EZ_ZOR: { en: "Deir ez-Zor", ar: "دير الزور" },
    RAQQA: { en: "Raqqa", ar: "الرقة" },
    HASAKA: { en: "Al-Hasakah", ar: "الحسكة" },
    QUNEITRA: { en: "Quneitra", ar: "القنيطرة" },
    DARAA: { en: "Daraa", ar: "درعا" },
    SUWAYDA: { en: "As-Suwayda", ar: "السويداء" }
  };

  var PITCH_SIZE_LABELS = {
    FIVE_A_SIDE: { en: "5-a-side", ar: "خماسي" },
    SIX_A_SIDE: { en: "6-a-side", ar: "سداسي" },
    SEVEN_A_SIDE: { en: "7-a-side", ar: "سباعي" },
    EIGHT_A_SIDE: { en: "8-a-side", ar: "ثماني" },
    ELEVEN_A_SIDE: { en: "11-a-side", ar: "أحد عشر" }
  };

  var CURRENCY_LABELS = {
    SYP: { en: "SYP", ar: "ل.س" }
  };

  /* ---------- tiny DOM helpers (textContent only — no HTML injection) ---------- */

  function el(tag, className, children) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    (children || []).forEach(function (child) {
      if (child === null || child === undefined) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  /** Bilingual fragment: <span data-en>en</span><span data-ar>ar</span>. */
  function bi(en, ar) {
    var frag = document.createDocumentFragment();
    var enSpan = el("span", null, [en]);
    enSpan.setAttribute("data-en", "");
    var arSpan = el("span", null, [ar]);
    arSpan.setAttribute("data-ar", "");
    frag.appendChild(enSpan);
    frag.appendChild(arSpan);
    return frag;
  }

  function labelFor(map, code) {
    if (map[code]) return map[code];
    // Unknown enum value: prettify the code instead of hiding real data.
    var pretty = String(code).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, function (c) {
      return c.toUpperCase();
    });
    return { en: pretty, ar: pretty };
  }

  function biLabel(map, code) {
    var label = labelFor(map, code);
    return bi(label.en, label.ar);
  }

  function formatCount(value) {
    return Number(value || 0).toLocaleString("en-US");
  }

  function formatPrice(price) {
    var num = Number(price);
    if (!isFinite(num)) return String(price);
    return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  /**
   * Make an <img> fail-safe: it is transparent until it actually loads
   * (whatever is behind it — e.g. the pitch-lines CSS placeholder — shows
   * through) and removes itself if the error event fires. This way broken
   * images can never show alt-text boxes, even in browsers that skip error
   * events for lazily-loaded images.
   */
  function failSafeImage(img, src) {
    img.addEventListener("load", function () { img.classList.add("loaded"); });
    img.addEventListener("error", function () {
      if (img.parentNode) img.parentNode.removeChild(img);
    });
    img.src = src;
    if (img.complete && img.naturalWidth > 0) img.classList.add("loaded");
    return img;
  }

  /**
   * Card media block. The container shows a pitch-lines placeholder as CSS
   * background; the <img> is only added for a usable URL.
   */
  function cardImage(url, altText) {
    var media = el("div", "lc-media", []);
    var resolved = window.CenterhaApi.resolveMediaUrl(url);
    if (resolved) {
      var img = document.createElement("img");
      img.className = "lc-img";
      img.loading = "lazy";
      img.alt = altText || "";
      media.appendChild(failSafeImage(img, resolved));
    }
    return media;
  }

  function show(node) { if (node) node.hidden = false; }
  function hide(node) { if (node) node.hidden = true; }

  /* ---------- stats strip + hero meta ---------- */

  function statTile(value, suffix, labelEn, labelAr) {
    var num = el("div", "num", []);
    num.dataset.count = String(value);
    // Render the final value immediately; the count-up is a progressive
    // enhancement so throttled rAF/observers can never leave a "0" behind.
    num.appendChild(document.createTextNode(Number(value).toLocaleString("en-US")));
    var suf = el("span", "suf", [suffix]);
    num.appendChild(suf);
    var lbl = el("div", "lbl", [bi(labelEn, labelAr)]);
    return el("div", "stat", [num, lbl]);
  }

  function animateCount(numEl) {
    var target = parseFloat(numEl.dataset.count) || 0;
    var duration = 1400;
    var start = null;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      numEl.childNodes[0].nodeValue = Math.round(target * eased).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(frame);
      else numEl.childNodes[0].nodeValue = target.toLocaleString("en-US");
    }
    requestAnimationFrame(frame);
  }

  function renderStats(stats) {
    var section = document.getElementById("liveStatsSec");
    var grid = document.getElementById("liveStatsGrid");
    if (!section || !grid) return;
    grid.textContent = "";

    var tiles = [
      { value: stats.fields, en: "Pitches listed", ar: "ملعب متوفر" },
      { value: stats.facilities, en: "Sport venues", ar: "منشأة رياضية" },
      { value: stats.cities, en: "Cities covered", ar: "محافظة مغطاة" },
      { value: stats.bookings, en: "Bookings made", ar: "حجز ناجح" }
    ].filter(function (tile) { return Number(tile.value) > 0; });

    if (tiles.length === 0) { hide(section); return; }

    tiles.forEach(function (tile) {
      grid.appendChild(statTile(tile.value, "+", tile.en, tile.ar));
    });
    show(section);

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      grid.querySelectorAll(".num").forEach(function (n) { io.observe(n); });
    } else {
      grid.querySelectorAll(".num").forEach(function (n) {
        n.childNodes[0].nodeValue = Number(n.dataset.count).toLocaleString("en-US");
      });
    }
  }

  /**
   * Arabic count noun: 2–10 take the plural form, 1 and 11+ the singular
   * ("3 محافظات" but "41 ملعب"). English: simple s-plural via the two forms.
   */
  function countNoun(n, enOne, enMany, arOne, arMany) {
    var en = n === 1 ? enOne : enMany;
    var ar = n >= 2 && n <= 10 ? arMany : arOne;
    return bi(formatCount(n) + " " + en, formatCount(n) + " " + ar);
  }

  function renderHeroMeta(stats) {
    var meta = document.getElementById("heroMeta");
    if (!meta) return;
    meta.textContent = "";

    var parts = [];
    if (stats.fields > 0) {
      parts.push(countNoun(stats.fields, "pitch", "pitches", "ملعب", "ملاعب"));
    }
    if (stats.facilities > 0) {
      parts.push(countNoun(stats.facilities, "venue", "venues", "منشأة", "منشآت"));
    }
    if (stats.cities > 0) {
      parts.push(countNoun(stats.cities, "governorate", "governorates", "محافظة", "محافظات"));
    }
    if (parts.length === 0) { hide(meta); return; }

    parts.forEach(function (part, index) {
      if (index > 0) meta.appendChild(el("span", "sep", ["·"]));
      meta.appendChild(el("span", null, [part]));
    });
    show(meta);
    meta.classList.add("in");
  }

  /* ---------- banners ---------- */

  function safeBannerLink(banner) {
    if (!banner.hasAction || banner.actionType !== "EXTERNAL") return null;
    if (typeof banner.actionTarget !== "string") return null;
    return /^https:\/\//i.test(banner.actionTarget) ? banner.actionTarget : null;
  }

  function renderBanners(banners) {
    var wrap = document.getElementById("liveBanners");
    if (!wrap) return;
    wrap.textContent = "";
    var usable = (banners || []).filter(function (banner) {
      return window.CenterhaApi.resolveMediaUrl(banner.imageUrl);
    });
    if (usable.length === 0) { hide(wrap); return; }

    usable.forEach(function (banner) {
      // Banners sit near the top of the page — load them eagerly so the
      // load/error events (and the broken-banner cleanup) fire reliably.
      var img = document.createElement("img");
      img.className = "banner-img";
      img.alt = banner.title || "";
      img.addEventListener("error", function () {
        var item = img.closest(".banner-item");
        if (item && item.parentNode) item.parentNode.removeChild(item);
        if (!wrap.querySelector(".banner-item")) hide(wrap);
      });
      failSafeImage(img, window.CenterhaApi.resolveMediaUrl(banner.imageUrl));

      var inner = [img];
      if (banner.title) inner.push(el("span", "banner-title", [banner.title]));

      var href = safeBannerLink(banner);
      var item;
      if (href) {
        item = el("a", "banner-item", inner);
        item.href = href;
        item.target = "_blank";
        item.rel = "noopener noreferrer";
      } else {
        item = el("div", "banner-item", inner);
      }
      wrap.appendChild(item);
    });
    show(wrap);
  }

  /* ---------- pitch + venue + city + category cards ---------- */


  /**
   * Price fragment for a card footer. Falls back to an honest
   * "price not available" label when the API price is missing/invalid —
   * never shows "NaN" or an empty amount.
   */
  function priceFragment(price, currencyCode) {
    var num = Number(price);
    if (price === null || price === undefined || price === "" || !isFinite(num)) {
      return el("span", "lc-price lc-price-na", [bi("Price not available", "السعر غير محدد")]);
    }
    var currency = labelFor(CURRENCY_LABELS, currencyCode || "SYP");
    return el("span", "lc-price", [
      formatPrice(price) + " ",
      el("small", null, [bi(currency.en, currency.ar)])
    ]);
  }

  function fieldCard(field, featured) {
    var media = cardImage(field.mainImageUrl, field.fieldName);
    if (featured) {
      media.appendChild(el("span", "lc-badge", [bi("Featured", "مميز")]));
    }
    var body = el("div", "lc-body", [
      el("h4", "lc-title", [field.fieldName]),
      el("div", "lc-sub", [
        el("span", null, [field.facilityName]),
        el("span", "lc-dot", ["·"]),
        el("span", null, [biLabel(GOVERNORATE_LABELS, field.governorate)])
      ]),
      el("div", "lc-foot", [
        el("span", "lc-tag", [biLabel(PITCH_SIZE_LABELS, field.pitchSize)]),
        priceFragment(field.price, field.currency)
      ])
    ]);
    var card = el("a", "live-card lc-link", [media, body]);
    card.href = "field/?id=" + encodeURIComponent(field.fieldId);
    card.addEventListener("click", function () {
      window.centerhaTrack("search_result_clicked", { fieldId: field.fieldId, source: "landing" });
    });
    card.dataset.governorate = field.governorate;
    card.dataset.pitchSize = field.pitchSize;
    return card;
  }

  function facilityCard(facility) {
    var body = el("div", "lc-body", [
      el("h4", "lc-title", [facility.name]),
      el("div", "lc-sub", [
        el("span", null, [biLabel(GOVERNORATE_LABELS, facility.governorate)])
      ]),
      el("div", "lc-foot", [
        el("span", "lc-tag", [countNoun(facility.activeFieldsCount, "pitch", "pitches", "ملعب", "ملاعب")])
      ])
    ]);
    return el("article", "live-card", [cardImage(facility.imageUrl, facility.name), body]);
  }

  function cityCard(city) {
    return el("div", "city-card", [
      el("div", "city-name", [biLabel(GOVERNORATE_LABELS, city.governorate)]),
      el("div", "city-meta", [
        el("span", null, [countNoun(city.facilitiesCount, "venue", "venues", "منشأة", "منشآت")]),
        el("span", "lc-dot", ["·"]),
        el("span", null, [countNoun(city.fieldsCount, "pitch", "pitches", "ملعب", "ملاعب")])
      ])
    ]);
  }

  function categoryChip(category) {
    return el("div", "cat-chip", [
      el("span", "cat-name", [biLabel(PITCH_SIZE_LABELS, category.pitchSize)]),
      el("span", "cat-count", [formatCount(category.fieldsCount)])
    ]);
  }

  function renderCardsInto(wrapId, gridId, items, toCard) {
    var wrap = document.getElementById(wrapId);
    var grid = document.getElementById(gridId);
    if (!wrap || !grid) return;
    grid.textContent = "";
    if (!items || items.length === 0) { hide(wrap); return; }
    items.forEach(function (item) { grid.appendChild(toCard(item)); });
    show(wrap);
  }

  /* ---------- filters (client-side, over the loaded cards) ---------- */

  var filterState = { governorate: "", pitchSize: "" };

  function optionLabel(map, code, lang) {
    return labelFor(map, code)[lang === "ar" ? "ar" : "en"];
  }

  function fillSelect(select, codes, map, placeholderEn, placeholderAr) {
    var lang = window.CenterhaLanguage ? window.CenterhaLanguage.get() : "en";
    var current = select.value;
    select.textContent = "";
    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = lang === "ar" ? placeholderAr : placeholderEn;
    select.appendChild(placeholder);
    (codes || []).forEach(function (code) {
      var option = document.createElement("option");
      option.value = code;
      option.textContent = optionLabel(map, code, lang);
      select.appendChild(option);
    });
    select.value = current;
    if (select.value !== current) select.value = "";
  }

  var selectFillers = [];

  function setupFilters(searchMetadata) {
    var filters = document.getElementById("liveFilters");
    var citySelect = document.getElementById("filterCity");
    var sizeSelect = document.getElementById("filterSize");
    var resetBtn = document.getElementById("filterReset");
    if (!filters || !citySelect || !sizeSelect) return;

    selectFillers.push(
      function () {
        fillSelect(citySelect, searchMetadata.governorates, GOVERNORATE_LABELS, "All cities", "كل المحافظات");
      },
      function () {
        fillSelect(sizeSelect, searchMetadata.pitchSizes, PITCH_SIZE_LABELS, "All pitch sizes", "كل الأحجام");
      }
    );
    selectFillers.slice(-2).forEach(function (fill) { fill(); });

    citySelect.addEventListener("change", function () {
      filterState.governorate = citySelect.value;
      applyFilters();
    });
    sizeSelect.addEventListener("change", function () {
      filterState.pitchSize = sizeSelect.value;
      applyFilters();
    });
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        citySelect.value = "";
        sizeSelect.value = "";
        filterState.governorate = "";
        filterState.pitchSize = "";
        applyFilters();
      });
    }
    show(filters);
  }

  function applyFilters() {
    var anyVisible = false;
    ["liveFeaturedWrap", "liveRecentWrap"].forEach(function (wrapId) {
      var wrap = document.getElementById(wrapId);
      if (!wrap || wrap.dataset.empty === "true") return;
      var visibleInWrap = 0;
      wrap.querySelectorAll(".live-card").forEach(function (card) {
        var matches =
          (!filterState.governorate || card.dataset.governorate === filterState.governorate) &&
          (!filterState.pitchSize || card.dataset.pitchSize === filterState.pitchSize);
        card.hidden = !matches;
        if (matches) visibleInWrap += 1;
      });
      wrap.hidden = visibleInWrap === 0;
      if (visibleInWrap > 0) anyVisible = true;
    });
    var noMatch = document.getElementById("liveNoMatch");
    if (noMatch) noMatch.hidden = anyVisible;
  }

  /* ---------- hero search (submits to search/ → GET /api/catalog/public) ---------- */

  function setupHeroSearch(searchMetadata) {
    var citySelect = document.getElementById("heroCity");
    var sizeSelect = document.getElementById("heroSize");
    if (!citySelect || !sizeSelect) return;

    selectFillers.push(
      function () {
        fillSelect(citySelect, searchMetadata.governorates, GOVERNORATE_LABELS, "All governorates", "كل المحافظات");
      },
      function () {
        fillSelect(sizeSelect, searchMetadata.pitchSizes, PITCH_SIZE_LABELS, "All pitch sizes", "كل الأنواع");
      }
    );
    selectFillers.slice(-2).forEach(function (fill) { fill(); });
  }

  /* ---------- hero phone + map mock: fill with the FIRST real featured field ---------- */

  function renderHeroPhone(featuredFields) {
    var field = (featuredFields || [])[0];
    if (!field) return; // keep the neutral branded preview — no fake data

    var nameRow = document.getElementById("phoneName");
    var nameEl = document.getElementById("phoneFieldName");
    var priceEl = document.getElementById("phonePrice");
    var subEl = document.getElementById("phoneSub");
    var placeholder = document.getElementById("phonePlaceholder");
    var photo = document.getElementById("phonePhoto");
    var tag = document.getElementById("phoneTag");
    if (!nameRow || !nameEl || !priceEl || !subEl) return;

    nameEl.textContent = field.fieldName;
    var currency = labelFor(CURRENCY_LABELS, field.currency || "SYP");
    priceEl.textContent = "";
    if (isFinite(Number(field.price))) {
      priceEl.appendChild(document.createTextNode(formatPrice(field.price)));
      priceEl.appendChild(el("small", null, [bi(" " + currency.en, " " + currency.ar)]));
    }

    subEl.textContent = "";
    subEl.appendChild(el("span", null, [biLabel(PITCH_SIZE_LABELS, field.pitchSize)]));
    subEl.appendChild(el("span", null, ["·"]));
    subEl.appendChild(el("span", null, [biLabel(GOVERNORATE_LABELS, field.governorate)]));

    show(nameRow);
    show(subEl);
    show(tag);
    hide(placeholder);

    var imageUrl = window.CenterhaApi.resolveMediaUrl(field.mainImageUrl);
    if (photo && imageUrl) {
      var existing = photo.querySelector(".ph-img");
      if (existing) existing.remove();
      var img = document.createElement("img");
      img.className = "ph-img";
      img.alt = field.fieldName;
      photo.insertBefore(failSafeImage(img, imageUrl), photo.firstChild);
    }

    var mapTitle = document.getElementById("mapCardTitle");
    var mapMeta = document.getElementById("mapCardMeta");
    if (mapTitle && mapMeta) {
      mapTitle.textContent = field.fieldName;
      mapMeta.textContent = "";
      mapMeta.appendChild(biLabel(PITCH_SIZE_LABELS, field.pitchSize));
      mapMeta.appendChild(document.createTextNode(" · " + formatPrice(field.price) + " "));
      mapMeta.appendChild(bi(currency.en, currency.ar));
    }
  }

  /* ---------- features spotlight: real confirmed-bookings count ---------- */

  function renderFeatureBookings(stats) {
    var num = document.getElementById("featBookings");
    var label = document.getElementById("featBookingsLabel");
    if (!num || !label) return;
    if (!stats || !(stats.bookings > 0)) return; // stays hidden — no fake numbers
    num.textContent = formatCount(stats.bookings);
    num.appendChild(el("span", "stat-suffix", ["+"]));
    show(num);
    show(label);
  }

  /* ---------- footer content links ---------- */

  function renderFooterContentLinks(contentPages) {
    var list = document.getElementById("footerCompanyLinks");
    if (!list || !contentPages) return;
    contentPages.forEach(function (page) {
      if (!page || !page.slug) return;
      var link = el("a", null, [bi(page.titleEn, page.titleAr)]);
      link.href = "pages/content.html?slug=" + encodeURIComponent(page.slug);
      list.appendChild(el("li", null, [link]));
    });
  }

  /* ---------- states + orchestration ---------- */

  function setState(state) {
    hide(document.getElementById("liveLoading"));
    hide(document.getElementById("liveError"));
    hide(document.getElementById("liveEmpty"));
    hide(document.getElementById("liveContent"));
    var target = {
      loading: "liveLoading",
      error: "liveError",
      empty: "liveEmpty",
      content: "liveContent"
    }[state];
    show(document.getElementById(target));
  }

  function dedupeRecent(recentFields, featuredFields) {
    var featuredIds = {};
    (featuredFields || []).forEach(function (field) { featuredIds[field.fieldId] = true; });
    return (recentFields || []).filter(function (field) { return !featuredIds[field.fieldId]; });
  }

  function render(data) {
    // Reset language-refresh hooks — render() can run again after a retry.
    selectFillers = [];
    var stats = data.stats || { cities: 0, facilities: 0, fields: 0, bookings: 0 };
    renderStats(stats);
    renderHeroMeta(stats);
    renderFeatureBookings(stats);
    renderHeroPhone(data.featuredFields);
    setupHeroSearch(data.searchMetadata || { governorates: [], pitchSizes: [] });
    renderFooterContentLinks(data.contentPages);

    var featured = data.featuredFields || [];
    var recent = dedupeRecent(data.recentFields, featured);
    var facilities = data.recentFacilities || [];
    var cities = data.cities || [];
    var categories = data.categories || [];
    var banners = data.banners || [];

    var isEmpty =
      featured.length === 0 && recent.length === 0 && facilities.length === 0 &&
      cities.length === 0 && categories.length === 0 && banners.length === 0;
    if (isEmpty) { setState("empty"); return; }

    renderBanners(banners);
    renderCardsInto("liveFeaturedWrap", "liveFeaturedGrid", featured, function (field) {
      return fieldCard(field, true);
    });
    renderCardsInto("liveRecentWrap", "liveRecentGrid", recent, function (field) {
      return fieldCard(field, false);
    });
    ["liveFeaturedWrap", "liveRecentWrap"].forEach(function (wrapId) {
      var wrap = document.getElementById(wrapId);
      if (wrap) wrap.dataset.empty = wrap.hidden ? "true" : "false";
    });
    renderCardsInto("liveFacilitiesWrap", "liveFacilitiesGrid", facilities, facilityCard);
    renderCardsInto("liveCitiesWrap", "liveCitiesGrid", cities, cityCard);
    renderCardsInto("liveCategoriesWrap", "liveCategoriesGrid", categories, categoryChip);

    if (featured.length > 0 || recent.length > 0) {
      setupFilters(data.searchMetadata || { governorates: [], pitchSizes: [] });
    }
    setState("content");
  }

  function load() {
    setState("loading");
    window.CenterhaApi.fetchLanding()
      .then(render)
      .catch(function (error) {
        if (window.console && console.warn) console.warn("Landing data unavailable:", error);
        setState("error");
      });
  }

  function init() {
    window.centerhaTrack("landing_view", { path: window.location.pathname });

    // Owner CTA tracking (anonymous — element context only).
    document.querySelectorAll('a[href*="app.centerha.software"]').forEach(function (ownerLink) {
      ownerLink.addEventListener("click", function () {
        window.centerhaTrack("owner_cta_clicked", { source: "landing" });
      });
    });

    var retry = document.getElementById("liveRetry");
    if (retry) retry.addEventListener("click", load);
    document.addEventListener("centerha:languagechange", function () {
      selectFillers.forEach(function (fill) { fill(); });
    });
    load();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
