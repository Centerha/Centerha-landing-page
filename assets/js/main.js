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

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item .faq-q').forEach(function(btn){
    var item = btn.closest('.faq-item');
    var answer = item && item.querySelector('.faq-a');
    btn.setAttribute('aria-expanded', String(Boolean(item && item.classList.contains('open'))));
    if (answer) answer.setAttribute('aria-hidden', String(!item.classList.contains('open')));
    btn.addEventListener('click', function(){
      var currentItem = btn.closest('.faq-item');
      var isOpen = currentItem.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function(other){
        var otherButton = other.querySelector('.faq-q');
        var otherAnswer = other.querySelector('.faq-a');
        other.classList.remove('open');
        if (otherButton) otherButton.setAttribute('aria-expanded', 'false');
        if (otherAnswer) otherAnswer.setAttribute('aria-hidden', 'true');
      });
      if (!isOpen) {
        var answer = currentItem.querySelector('.faq-a');
        currentItem.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        if (answer) answer.setAttribute('aria-hidden', 'false');
      }
    });
  });

  /* ---------- mobile full-screen menu ---------- */
  var navToggle = document.getElementById('navToggle');
  var mobileMenu = document.getElementById('mobileMenu');
  var mmClose = document.getElementById('mmClose');
  function focusWithoutScroll(element){
    if (!element || typeof element.focus !== 'function') return;
    try { element.focus({ preventScroll: true }); }
    catch (error) { element.focus(); }
  }
  function menuIsOpen(){ return Boolean(mobileMenu && mobileMenu.getAttribute('aria-hidden') === 'false'); }
  function openMenu(){
    if (!mobileMenu) return;
    document.body.classList.add('menu-open');
    mobileMenu.setAttribute('aria-hidden','false');
    if(navToggle) navToggle.setAttribute('aria-expanded','true');
    var target = mmClose || mobileMenu.querySelector('a, button');
    window.requestAnimationFrame(function(){
      if (menuIsOpen()) focusWithoutScroll(target);
    });
  }
  function closeMenu(restoreFocus){
    if (!mobileMenu || !menuIsOpen()) return;
    document.body.classList.remove('menu-open');
    mobileMenu.setAttribute('aria-hidden','true');
    if(navToggle) navToggle.setAttribute('aria-expanded','false');
    if (restoreFocus !== false) focusWithoutScroll(navToggle);
  }
  if (navToggle) navToggle.addEventListener('click', openMenu);
  if (mmClose) mmClose.addEventListener('click', closeMenu);
  if (mobileMenu){
    mobileMenu.querySelectorAll('.mm-links a, .mm-download').forEach(function(a){
      a.addEventListener('click', function(){ closeMenu(false); });
    });
    mobileMenu.addEventListener('click', function(event){
      if (event.target === mobileMenu || event.target === mobileMenu.querySelector('.mm-links')) closeMenu(false);
    });
  }

  /* ---------- secondary-page mobile menu ---------- */
  var pageMenuToggle = document.querySelector('.page-menu-toggle');
  var pageNav = document.querySelector('.app-page .nav-links');
  function pageMenuIsOpen(){ return Boolean(pageNav && pageNav.classList.contains('is-open')); }
  function closePageMenu(restoreFocus){
    if (!pageMenuToggle || !pageNav) return;
    var wasOpen = pageMenuIsOpen();
    pageNav.classList.remove('is-open');
    pageMenuToggle.setAttribute('aria-expanded', 'false');
    if (wasOpen && restoreFocus) focusWithoutScroll(pageMenuToggle);
  }
  if (pageMenuToggle && pageNav){
    pageMenuToggle.addEventListener('click', function(e){
      e.stopPropagation();
      var isOpen = pageNav.classList.toggle('is-open');
      pageMenuToggle.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) focusWithoutScroll(pageNav.querySelector('a'));
    });
    pageNav.querySelectorAll('a').forEach(function(link){
      link.addEventListener('click', function(){ closePageMenu(false); });
    });
    document.addEventListener('click', function(e){
      if (!pageMenuIsOpen()) return;
      if (pageNav.contains(e.target) || pageMenuToggle.contains(e.target)) return;
      closePageMenu(false);
    });
  }

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){
      if (menuIsOpen()) closeMenu();
      if (pageMenuIsOpen()) closePageMenu(true);
      return;
    }
    if (e.key === 'Tab' && menuIsOpen()){
      var focusable = Array.prototype.slice.call(mobileMenu.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter(function(element){ return element.getClientRects().length > 0; });
      if (!focusable.length) { e.preventDefault(); return; }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && (document.activeElement === first || !mobileMenu.contains(document.activeElement))){
        e.preventDefault(); focusWithoutScroll(last);
      } else if (!e.shiftKey && (document.activeElement === last || !mobileMenu.contains(document.activeElement))){
        e.preventDefault(); focusWithoutScroll(first);
      }
    }
  });

  window.addEventListener('resize', function(){
    if (window.matchMedia('(min-width:981px)').matches) closePageMenu(false);
    if (window.matchMedia('(min-width:761px)').matches) closeMenu(false);
    syncFooterAccordions();
  });

  /* ---------- footer accordion (mobile only) ---------- */
  function syncFooterAccordions(){
    var mobile = window.matchMedia('(max-width:480px)').matches;
    document.querySelectorAll('.f-col-h').forEach(function(heading){
      var column = heading.closest('.f-col');
      heading.setAttribute('aria-expanded', String(!mobile || column.classList.contains('open')));
    });
  }
  document.querySelectorAll('.f-col-h').forEach(function(h){
    h.addEventListener('click', function(){
      if (window.matchMedia('(max-width:480px)').matches){
        var column = h.closest('.f-col');
        column.classList.toggle('open');
        h.setAttribute('aria-expanded', String(column.classList.contains('open')));
      }
    });
  });
  syncFooterAccordions();
})();
