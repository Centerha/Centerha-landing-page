/**
 * Public field detail page (field/?id=<fieldId>).
 *
 * Data sources (all real, all anonymous):
 *   - GET /api/fields/:id                    field detail (active fields only)
 *   - GET /api/facilities/:id/slots          14-day availability preview
 *   - GET /api/catalog/public                similar pitches
 *
 * All API strings are inserted via textContent — no HTML injection possible.
 * SEO note: title/description/canonical/JSON-LD are set client-side; crawlers
 * that do not execute JS see the generic tags in field/index.html.
 *
 * NOTE: label maps + helpers intentionally mirror search-page.js — the site
 * has no build step, pages stay self-contained.
 */
(function () {
  "use strict";

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

  var DAY_LABELS = {
    0: { en: "Sun", ar: "الأحد" },
    1: { en: "Mon", ar: "الاثنين" },
    2: { en: "Tue", ar: "الثلاثاء" },
    3: { en: "Wed", ar: "الأربعاء" },
    4: { en: "Thu", ar: "الخميس" },
    5: { en: "Fri", ar: "الجمعة" },
    6: { en: "Sat", ar: "السبت" }
  };

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

  function show(node) { if (node) node.hidden = false; }
  function hide(node) { if (node) node.hidden = true; }

  function setState(state) {
    hide(document.getElementById("fieldLoading"));
    hide(document.getElementById("fieldError"));
    hide(document.getElementById("fieldContent"));
    var id = { loading: "fieldLoading", error: "fieldError", content: "fieldContent" }[state];
    show(document.getElementById(id));
  }

  /* ---------- SEO ---------- */

  function applySeo(field) {
    var gov = labelFor(GOVERNORATE_LABELS, field.governorate);
    var size = labelFor(PITCH_SIZE_LABELS, field.pitchSize);
    var title = field.name + " — " + gov.ar + " | سنطرها Centerha";
    var description =
      "احجز " + field.name + " (" + size.ar + ") في " + gov.ar +
      " عبر سنطرها — السعر والمواعيد المتاحة مباشرة من المنصة.";

    document.title = title;

    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description);
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", title);
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", description);

    var canonicalUrl = "https://centerha.software/field/?id=" + encodeURIComponent(field.id);
    var canonical = document.getElementById("canonicalLink");
    if (canonical) canonical.setAttribute("href", canonicalUrl);

    var mainImage = window.CenterhaApi.resolveMediaUrl(
      (field.images && field.images[0] && field.images[0].url) || field.facilityImageUrl
    );
    if (mainImage) {
      var ogImage = document.createElement("meta");
      ogImage.setAttribute("property", "og:image");
      ogImage.setAttribute("content", mainImage);
      document.head.appendChild(ogImage);
    }

    // JSON-LD (SportsActivityLocation) — injected via textContent, so field
    // data cannot break out of the script tag.
    var jsonLd = {
      "@context": "https://schema.org",
      "@type": "SportsActivityLocation",
      "@id": canonicalUrl,
      name: field.name,
      url: canonicalUrl,
      sport: "Football",
      containedInPlace: { "@type": "Place", name: field.facilityName },
      address: { "@type": "PostalAddress", addressRegion: gov.en, addressCountry: "SY" },
      geo: { "@type": "GeoCoordinates", latitude: field.latitude, longitude: field.longitude }
    };
    if (mainImage) jsonLd.image = mainImage;
    var priceNum = Number(field.price);
    if (isFinite(priceNum) && priceNum > 0) {
      jsonLd.offers = {
        "@type": "Offer",
        price: priceNum,
        priceCurrency: field.currency || "SYP",
        availability: "https://schema.org/InStock"
      };
    }
    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }

  /* ---------- gallery ---------- */

  function sortedImages(field) {
    var images = (field.images || []).slice();
    images.sort(function (a, b) {
      return (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0) || a.order - b.order;
    });
    return images
      .map(function (img) { return window.CenterhaApi.resolveMediaUrl(img.url); })
      .filter(Boolean);
  }

  function setMainImage(url, altText) {
    var media = document.getElementById("fdMainMedia");
    var existing = media.querySelector(".fd-main-img");
    if (existing) existing.remove();
    if (!url) return;
    var img = document.createElement("img");
    img.className = "fd-main-img";
    img.alt = altText;
    media.appendChild(failSafeImage(img, url));
  }

  function renderGallery(field) {
    var urls = sortedImages(field);
    setMainImage(urls[0] || null, field.name);
    var thumbs = document.getElementById("fdThumbs");
    if (urls.length < 2) { hide(thumbs); return; }
    thumbs.textContent = "";
    urls.slice(0, 8).forEach(function (url, index) {
      var btn = el("button", "fd-thumb" + (index === 0 ? " on" : ""), []);
      btn.type = "button";
      btn.setAttribute("aria-label", field.name + " " + (index + 1));
      var img = document.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      btn.appendChild(failSafeImage(img, url));
      btn.addEventListener("click", function () {
        thumbs.querySelectorAll(".fd-thumb").forEach(function (t) { t.classList.remove("on"); });
        btn.classList.add("on");
        setMainImage(url, field.name);
      });
      thumbs.appendChild(btn);
    });
    show(thumbs);
  }

  /* ---------- summary ---------- */

  function renderSummary(field) {
    document.getElementById("fdCrumbName").textContent = field.name;
    document.getElementById("fdName").textContent = field.name;

    var sizeChip = document.getElementById("fdSize");
    sizeChip.textContent = "";
    sizeChip.appendChild(biLabel(PITCH_SIZE_LABELS, field.pitchSize));

    var cityChip = document.getElementById("fdCity");
    cityChip.textContent = "";
    cityChip.appendChild(biLabel(GOVERNORATE_LABELS, field.governorate));

    var durationChip = document.getElementById("fdDuration");
    durationChip.textContent = "";
    var minutes = Number(field.slotDurationMinutes) || 60;
    durationChip.appendChild(bi(minutes + " min / slot", minutes + " دقيقة / حجز"));

    var facility = document.getElementById("fdFacility");
    facility.textContent = "";
    facility.appendChild(bi("Venue: ", "المنشأة: "));
    facility.appendChild(el("strong", null, [field.facilityName]));

    var currency = labelFor(CURRENCY_LABELS, field.currency || "SYP");
    var price = document.getElementById("fdPrice");
    price.textContent = "";
    price.appendChild(el("strong", null, [formatPrice(field.price)]));
    price.appendChild(el("span", "fd-currency", [bi(" " + currency.en, " " + currency.ar)]));
    price.appendChild(el("span", "fd-per", [bi(" / slot", " / الحجز")]));

    var deposit = document.getElementById("fdDeposit");
    if (field.hasMinimumDeposit && field.minimumDepositAmount) {
      deposit.textContent = "";
      deposit.appendChild(
        bi(
          "Booking deposit: " + formatPrice(field.minimumDepositAmount) + " " + currency.en,
          "عربون الحجز: " + formatPrice(field.minimumDepositAmount) + " " + currency.ar
        )
      );
      show(deposit);
    } else {
      hide(deposit);
    }

    var desc = document.getElementById("fdDesc");
    if (field.description) {
      desc.textContent = field.description;
      show(desc);
    } else {
      hide(desc);
    }
  }

  /* ---------- availability preview ---------- */

  function renderAvailability(field) {
    window.CenterhaApi.fetchFacilitySlots(field.facilityId)
      .then(function (facilityFields) {
        var entry = (facilityFields || []).find(function (f) { return f.fieldId === field.id; });
        if (!entry || !entry.dailySlots || entry.dailySlots.length === 0) return;

        var days = document.getElementById("fdDays");
        days.textContent = "";
        var rendered = 0;

        entry.dailySlots.slice(0, 7).forEach(function (day) {
          var available = (day.slots || []).filter(function (slot) { return slot.isAvailable; });
          var date = new Date(day.date + "T00:00:00");
          var dayLabel = labelFor(DAY_LABELS, isNaN(date.getDay()) ? "" : date.getDay());

          var card = el("div", "fd-day" + (available.length === 0 ? " full" : ""), [
            el("div", "fd-day-name", [bi(dayLabel.en, dayLabel.ar)]),
            el("div", "fd-day-date", [day.date.slice(5)]),
            el(
              "div",
              "fd-day-count",
              available.length > 0
                ? [
                    el("strong", null, [String(available.length)]),
                    bi(" open", " متاح")
                  ]
                : [bi("Fully booked", "محجوز بالكامل")]
            )
          ]);

          if (available.length > 0) {
            var times = el("div", "fd-day-times", []);
            available.slice(0, 3).forEach(function (slot) {
              times.appendChild(el("span", "fd-time", [slot.startTime]));
            });
            if (available.length > 3) {
              times.appendChild(el("span", "fd-time fd-time-more", ["+" + (available.length - 3)]));
            }
            card.appendChild(times);
          }

          days.appendChild(card);
          rendered += 1;
        });

        if (rendered > 0) show(document.getElementById("fdAvailabilitySec"));
      })
      .catch(function () {
        /* availability preview is optional — the page stays useful without it */
      });
  }

  /* ---------- similar fields ---------- */

  function similarCard(item) {
    var currency = labelFor(CURRENCY_LABELS, item.currency || "SYP");
    var media = el("div", "lc-media", []);
    var resolved = window.CenterhaApi.resolveMediaUrl(item.mainImageUrl);
    if (resolved) {
      var img = document.createElement("img");
      img.className = "lc-img";
      img.loading = "lazy";
      img.alt = item.fieldName;
      media.appendChild(failSafeImage(img, resolved));
    }
    var body = el("div", "lc-body", [
      el("h4", "lc-title", [item.fieldName]),
      el("div", "lc-sub", [
        el("span", null, [item.facilityName]),
        el("span", "lc-dot", ["·"]),
        el("span", null, [biLabel(GOVERNORATE_LABELS, item.governorate)])
      ]),
      el("div", "lc-foot", [
        el("span", "lc-tag", [biLabel(PITCH_SIZE_LABELS, item.pitchSize)]),
        el("span", "lc-price", [
          formatPrice(item.price) + " ",
          el("small", null, [bi(currency.en, currency.ar)])
        ])
      ])
    ]);
    var link = el("a", "live-card lc-link", [media, body]);
    link.href = "./?id=" + encodeURIComponent(item.fieldId);
    link.addEventListener("click", function () {
      window.centerhaTrack("search_result_clicked", { fieldId: item.fieldId, source: "similar" });
    });
    return link;
  }

  function renderSimilar(field) {
    window.CenterhaApi.searchCatalog({
      governorate: field.governorate,
      pitchSize: field.pitchSize,
      limit: 5,
      view: "FIELDS"
    })
      .then(function (result) {
        var items = (result.items || []).filter(function (item) {
          return item.type === "FIELD" && item.fieldId !== field.id;
        }).slice(0, 4);
        if (items.length === 0) return;
        var grid = document.getElementById("fdSimilarGrid");
        grid.textContent = "";
        items.forEach(function (item) { grid.appendChild(similarCard(item)); });
        show(document.getElementById("fdSimilarSec"));
      })
      .catch(function () { /* optional section */ });
  }

  /* ---------- orchestration ---------- */

  function fieldIdFromUrl() {
    var id = new URLSearchParams(window.location.search).get("id") || "";
    return /^[0-9a-f-]{16,64}$/i.test(id) ? id : "";
  }

  function load() {
    var fieldId = fieldIdFromUrl();
    if (!fieldId) {
      setState("error");
      return;
    }

    setState("loading");
    window.CenterhaApi.fetchFieldDetail(fieldId)
      .then(function (field) {
        applySeo(field);
        renderGallery(field);
        renderSummary(field);
        setState("content");
        window.centerhaTrack("field_detail_viewed", {
          fieldId: field.id,
          governorate: field.governorate,
          pitchSize: field.pitchSize
        });
        renderAvailability(field);
        renderSimilar(field);

        var cta = document.getElementById("fdBookCta");
        if (cta) {
          cta.addEventListener("click", function () {
            window.centerhaTrack("booking_cta_clicked", { fieldId: field.id, source: "field_detail" });
          });
        }
      })
      .catch(function (error) {
        if (window.console && console.warn) console.warn("Field detail unavailable:", error);
        setState("error");
      });
  }

  function init() {
    var retry = document.getElementById("fieldRetry");
    if (retry) retry.addEventListener("click", load);
    load();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
