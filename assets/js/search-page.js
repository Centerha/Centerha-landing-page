/**
 * Search page (search/) — backend-powered catalog search.
 *
 * Reads q / governorate / pitchSize / page from the URL (so the homepage hero
 * form's native GET works with no JS), calls GET /api/catalog/public via
 * CenterhaApi.searchCatalog, and renders paginated field cards with
 * loading / error / empty states.
 *
 * All API strings are inserted via textContent — no HTML injection possible.
 *
 * NOTE: label maps + card helpers intentionally mirror assets/js/landing.js.
 * This site has no build step, so the two pages stay self-contained; if a
 * bundler is ever introduced, extract these into one shared module.
 */
(function () {
  "use strict";

  var PAGE_SIZE = 12;

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

  var CURRENCY_LABELS = { SYP: { en: "SYP", ar: "ل.س" } };

  var SORT_OPTIONS = [
    { code: "featured", en: "Featured first", ar: "المميزة أولاً" },
    { code: "newest", en: "Newest", ar: "الأحدث" },
    { code: "price_asc", en: "Price: low to high", ar: "السعر: من الأقل" },
    { code: "price_desc", en: "Price: high to low", ar: "السعر: من الأعلى" }
  ];
  var VALID_SORTS = SORT_OPTIONS.map(function (o) { return o.code; });

  function parsePrice(raw) {
    if (raw === null || raw === undefined || raw === "") return "";
    var num = Number(raw);
    return isFinite(num) && num >= 0 ? String(Math.floor(num)) : "";
  }

  /* ---------- DOM helpers (textContent only) ---------- */

  function el(tag, className, children) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    (children || []).forEach(function (child) {
      if (child === null || child === undefined) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

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
    var pretty = String(code).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, function (c) {
      return c.toUpperCase();
    });
    return { en: pretty, ar: pretty };
  }

  function biLabel(map, code) {
    var label = labelFor(map, code);
    return bi(label.en, label.ar);
  }

  function formatPrice(price) {
    var num = Number(price);
    if (!isFinite(num)) return String(price);
    return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  function failSafeImage(img, src) {
    img.addEventListener("load", function () { img.classList.add("loaded"); });
    img.addEventListener("error", function () {
      if (img.parentNode) img.parentNode.removeChild(img);
    });
    img.src = src;
    if (img.complete && img.naturalWidth > 0) img.classList.add("loaded");
    return img;
  }

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

  function fieldCard(item) {
    var body = el("div", "lc-body", [
      el("h4", "lc-title", [item.fieldName]),
      el("div", "lc-sub", [
        el("span", null, [item.facilityName]),
        el("span", "lc-dot", ["·"]),
        el("span", null, [biLabel(GOVERNORATE_LABELS, item.governorate)])
      ]),
      el("div", "lc-foot", [
        el("span", "lc-tag", [biLabel(PITCH_SIZE_LABELS, item.pitchSize)]),
        priceFragment(item.price, item.currency)
      ])
    ]);
    var media = cardImage(item.mainImageUrl, item.fieldName);
    if (item.isFeatured) {
      media.appendChild(el("span", "lc-badge", [bi("Featured", "مميز")]));
    }
    var link = el("a", "live-card lc-link", [media, body]);
    link.href = "../field/?id=" + encodeURIComponent(item.fieldId);
    link.addEventListener("click", function () {
      window.centerhaTrack("search_result_clicked", { fieldId: item.fieldId, source: "search" });
    });
    return link;
  }

  function show(node) { if (node) node.hidden = false; }
  function hide(node) { if (node) node.hidden = true; }

  /* ---------- URL <-> state ---------- */

  function readStateFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var page = parseInt(params.get("page") || "1", 10);
    return {
      q: (params.get("q") || "").slice(0, 100),
      governorate: GOVERNORATE_LABELS[params.get("governorate")] ? params.get("governorate") : "",
      pitchSize: PITCH_SIZE_LABELS[params.get("pitchSize")] ? params.get("pitchSize") : "",
      sort: VALID_SORTS.indexOf(params.get("sort")) >= 0 ? params.get("sort") : "featured",
      priceMin: parsePrice(params.get("priceMin")),
      priceMax: parsePrice(params.get("priceMax")),
      page: isFinite(page) && page > 0 ? page : 1
    };
  }

  function writeStateToUrl(state, push) {
    var params = new URLSearchParams();
    if (state.q) params.set("q", state.q);
    if (state.governorate) params.set("governorate", state.governorate);
    if (state.pitchSize) params.set("pitchSize", state.pitchSize);
    if (state.sort && state.sort !== "featured") params.set("sort", state.sort);
    if (state.priceMin) params.set("priceMin", state.priceMin);
    if (state.priceMax) params.set("priceMax", state.priceMax);
    if (state.page > 1) params.set("page", String(state.page));
    var query = params.toString();
    var url = window.location.pathname + (query ? "?" + query : "");
    if (push) window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  }

  /* ---------- form ---------- */

  var citySelect, sizeSelect, qInput, sortSelect, priceMinInput, priceMaxInput;

  function currentLang() {
    return window.CenterhaLanguage ? window.CenterhaLanguage.get() : "ar";
  }

  function fillSelect(select, map, placeholderEn, placeholderAr) {
    var lang = currentLang();
    var current = select.value;
    select.textContent = "";
    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = lang === "ar" ? placeholderAr : placeholderEn;
    select.appendChild(placeholder);
    Object.keys(map).forEach(function (code) {
      var option = document.createElement("option");
      option.value = code;
      option.textContent = labelFor(map, code)[lang === "ar" ? "ar" : "en"];
      select.appendChild(option);
    });
    select.value = current;
    if (select.value !== current) select.value = "";
  }

  function fillSelects() {
    fillSelect(citySelect, GOVERNORATE_LABELS, "All governorates", "كل المحافظات");
    fillSelect(sizeSelect, PITCH_SIZE_LABELS, "All pitch sizes", "كل الأنواع");
    fillSortSelect();
  }

  function fillSortSelect() {
    if (!sortSelect) return;
    var lang = currentLang();
    var current = sortSelect.value || "featured";
    sortSelect.textContent = "";
    SORT_OPTIONS.forEach(function (option) {
      var node = document.createElement("option");
      node.value = option.code;
      node.textContent = lang === "ar" ? option.ar : option.en;
      sortSelect.appendChild(node);
    });
    sortSelect.value = current;
    if (sortSelect.value !== current) sortSelect.value = "featured";
  }

  function syncFormFromState(state) {
    citySelect.value = state.governorate;
    sizeSelect.value = state.pitchSize;
    qInput.value = state.q;
    if (sortSelect) sortSelect.value = state.sort || "featured";
    if (priceMinInput) priceMinInput.value = state.priceMin || "";
    if (priceMaxInput) priceMaxInput.value = state.priceMax || "";
  }

  /* ---------- rendering ---------- */

  function setResultsState(state) {
    hide(document.getElementById("resultsLoading"));
    hide(document.getElementById("resultsError"));
    hide(document.getElementById("resultsEmpty"));
    if (state === "loading") show(document.getElementById("resultsLoading"));
    if (state === "error") show(document.getElementById("resultsError"));
    if (state === "empty") show(document.getElementById("resultsEmpty"));
  }

  function renderInfo(total, page, totalPages) {
    var info = document.getElementById("resultsInfo");
    info.textContent = "";
    var count = Number(total).toLocaleString("en-US");
    // Arabic count noun: 2-10 take the plural ("3 ملاعب"), 1 and 11+ the singular.
    var arNoun = total >= 2 && total <= 10 ? " ملاعب" : " ملعب";
    info.appendChild(bi(
      count + (total === 1 ? " pitch found" : " pitches found"),
      count + arNoun
    ));
    if (totalPages > 1) {
      info.appendChild(el("span", "lc-dot", [" · "]));
      info.appendChild(bi("page " + page + " of " + totalPages, "صفحة " + page + " من " + totalPages));
    }
    show(info);
  }

  function renderPager(result) {
    var pager = document.getElementById("pager");
    var label = document.getElementById("pagerLabel");
    var prev = document.getElementById("pagerPrev");
    var next = document.getElementById("pagerNext");
    if (result.totalPages <= 1) { hide(pager); return; }
    label.textContent = "";
    label.appendChild(bi(result.page + " / " + result.totalPages, result.page + " / " + result.totalPages));
    prev.disabled = !result.hasPreviousPage;
    next.disabled = !result.hasNextPage;
    show(pager);
  }

  /* ---------- orchestration ---------- */

  var state = { q: "", governorate: "", pitchSize: "", sort: "featured", priceMin: "", priceMax: "", page: 1 };
  var requestSeq = 0;

  function load() {
    var seq = ++requestSeq;
    var grid = document.getElementById("resultsGrid");
    grid.textContent = "";
    hide(document.getElementById("resultsInfo"));
    hide(document.getElementById("pager"));
    setResultsState("loading");

    window.CenterhaApi.searchCatalog({
      q: state.q || undefined,
      governorate: state.governorate || undefined,
      pitchSize: state.pitchSize || undefined,
      sort: state.sort !== "featured" ? state.sort : undefined,
      priceMin: state.priceMin || undefined,
      priceMax: state.priceMax || undefined,
      page: state.page,
      limit: PAGE_SIZE,
      view: "FIELDS"
    })
      .then(function (result) {
        if (seq !== requestSeq) return; // a newer request superseded this one
        setResultsState("idle");
        var items = (result.items || []).filter(function (item) { return item.type === "FIELD"; });
        if (items.length === 0 && result.total > 0 && state.page > 1) {
          // Page number overshot the result set (filters changed) — restart at 1.
          state.page = 1;
          writeStateToUrl(state, false);
          load();
          return;
        }
        if (items.length === 0) {
          setResultsState("empty");
          renderInfo(0, 1, 1);
          return;
        }
        renderInfo(result.total, result.page, result.totalPages);
        items.forEach(function (item) { grid.appendChild(fieldCard(item)); });
        renderPager(result);
      })
      .catch(function (error) {
        if (seq !== requestSeq) return;
        if (window.console && console.warn) console.warn("Search unavailable:", error);
        setResultsState("error");
      });
  }

  function submit(page, push) {
    state = {
      q: qInput.value.trim().slice(0, 100),
      governorate: citySelect.value,
      pitchSize: sizeSelect.value,
      sort: sortSelect ? sortSelect.value : "featured",
      priceMin: priceMinInput ? parsePrice(priceMinInput.value) : "",
      priceMax: priceMaxInput ? parsePrice(priceMaxInput.value) : "",
      page: page
    };
    writeStateToUrl(state, push);
    // Anonymous filter context only — never user input free-text beyond length cap.
    window.centerhaTrack("search_submitted", {
      governorate: state.governorate || null,
      pitchSize: state.pitchSize || null,
      sort: state.sort,
      hasKeyword: Boolean(state.q),
      hasPriceFilter: Boolean(state.priceMin || state.priceMax),
      page: state.page
    });
    load();
  }

  function init() {
    citySelect = document.getElementById("searchCity");
    sizeSelect = document.getElementById("searchSize");
    qInput = document.getElementById("searchQ");
    sortSelect = document.getElementById("searchSort");
    priceMinInput = document.getElementById("searchPriceMin");
    priceMaxInput = document.getElementById("searchPriceMax");
    fillSelects();

    if (sortSelect) {
      sortSelect.addEventListener("change", function () { submit(1, true); });
    }

    state = readStateFromUrl();
    syncFormFromState(state);
    writeStateToUrl(state, false);

    document.getElementById("searchForm").addEventListener("submit", function (event) {
      event.preventDefault();
      submit(1, true);
    });
    document.getElementById("searchClear").addEventListener("click", function () {
      qInput.value = "";
      citySelect.value = "";
      sizeSelect.value = "";
      if (sortSelect) sortSelect.value = "featured";
      if (priceMinInput) priceMinInput.value = "";
      if (priceMaxInput) priceMaxInput.value = "";
      submit(1, true);
    });
    document.getElementById("resultsRetry").addEventListener("click", load);
    document.getElementById("pagerPrev").addEventListener("click", function () {
      if (state.page > 1) { submit(state.page - 1, true); window.scrollTo({ top: 0, behavior: "smooth" }); }
    });
    document.getElementById("pagerNext").addEventListener("click", function () {
      submit(state.page + 1, true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    window.addEventListener("popstate", function () {
      state = readStateFromUrl();
      syncFormFromState(state);
      load();
    });
    document.addEventListener("centerha:languagechange", fillSelects);

    load();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
