(function(){
  "use strict";

  /* ---------- nav blur on scroll ---------- */
  var nav = document.getElementById('nav');
  function onScroll(){ if (nav) nav.classList.toggle('scrolled', window.scrollY > 12); }
  document.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* ---------- staggered scroll reveals ---------- */
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          var sibs = Array.prototype.slice.call(e.target.parentNode.children).filter(function(n){ return n.classList && n.classList.contains('reveal'); });
          var i = sibs.indexOf(e.target);
          e.target.style.transitionDelay = Math.min(i,6)*70 + 'ms';
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold:0.12, rootMargin:'0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
  }

  /* ---------- animated count-up stats ---------- */
  function animateCount(el){
    var target = parseFloat(el.dataset.count);
    var decimals = parseInt(el.dataset.decimals || '0', 10);
    var asK = el.dataset.format === 'k';
    var suffix = el.dataset.suffix || '';
    var dur = 1500, start = null;
    function frame(ts){
      if (!start) start = ts;
      var p = Math.min((ts - start)/dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);            // easeOutCubic
      var val = target * eased;
      var out;
      if (asK){ out = (val/1000).toFixed(val >= 9999 ? 0 : 1) + 'k'; }
      else { out = val.toFixed(decimals); }
      el.firstChild ? (el.childNodes[0].nodeValue = out) : (el.textContent = out);
      // keep the suffix <span>
      if (p < 1) requestAnimationFrame(frame);
      else { el.childNodes[0].nodeValue = asK ? (target/1000)+'k' : target.toFixed(decimals); }
    }
    // ensure a text node exists before the suffix span
    if (el.childNodes[0].nodeType !== 3){ el.insertBefore(document.createTextNode('0'), el.firstChild); }
    requestAnimationFrame(frame);
  }
  if ('IntersectionObserver' in window){
    var sio = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){ animateCount(e.target); sio.unobserve(e.target); }
      });
    }, { threshold:0.5 });
    document.querySelectorAll('.stat .num').forEach(function(n){ sio.observe(n); });
  } else {
    document.querySelectorAll('.stat .num').forEach(function(n){
      var asK = n.dataset.format === 'k';
      n.insertBefore(document.createTextNode(asK ? (n.dataset.count/1000)+'k' : n.dataset.count), n.firstChild);
    });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item .faq-q').forEach(function(btn){
    btn.addEventListener('click', function(){
      var item = btn.closest('.faq-item');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function(i){ i.classList.remove('open'); });
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ---------- mobile full-screen menu ---------- */
  var navToggle = document.getElementById('navToggle');
  var mobileMenu = document.getElementById('mobileMenu');
  var mmClose = document.getElementById('mmClose');
  function openMenu(){ if (!mobileMenu) return; document.body.classList.add('menu-open'); mobileMenu.setAttribute('aria-hidden','false'); if(navToggle) navToggle.setAttribute('aria-expanded','true'); }
  function closeMenu(){ if (!mobileMenu) return; document.body.classList.remove('menu-open'); mobileMenu.setAttribute('aria-hidden','true'); if(navToggle) navToggle.setAttribute('aria-expanded','false'); }
  if (navToggle) navToggle.addEventListener('click', openMenu);
  if (mmClose) mmClose.addEventListener('click', closeMenu);
  if (mobileMenu){
    mobileMenu.querySelectorAll('.mm-links a, .mm-download').forEach(function(a){
      a.addEventListener('click', closeMenu);
    });
  }

  /* ---------- secondary-page mobile menu ---------- */
  var pageMenuToggle = document.querySelector('.page-menu-toggle');
  var pageNav = document.querySelector('.app-page .nav-links');
  function closePageMenu(){
    if (!pageMenuToggle || !pageNav) return;
    pageNav.classList.remove('is-open');
    pageMenuToggle.setAttribute('aria-expanded', 'false');
  }
  if (pageMenuToggle && pageNav){
    pageMenuToggle.addEventListener('click', function(e){
      e.stopPropagation();
      var isOpen = pageNav.classList.toggle('is-open');
      pageMenuToggle.setAttribute('aria-expanded', String(isOpen));
    });
    pageNav.querySelectorAll('a').forEach(function(link){
      link.addEventListener('click', closePageMenu);
    });
    document.addEventListener('click', function(e){
      if (!pageNav.classList.contains('is-open')) return;
      if (pageNav.contains(e.target) || pageMenuToggle.contains(e.target)) return;
      closePageMenu();
    });
  }

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){
      closeMenu();
      closePageMenu();
    }
  });

  /* ---------- footer accordion (mobile only) ---------- */
  document.querySelectorAll('.f-col-h').forEach(function(h){
    h.addEventListener('click', function(){
      if (window.matchMedia('(max-width:480px)').matches){
        h.closest('.f-col').classList.toggle('open');
      }
    });
  });
})();
