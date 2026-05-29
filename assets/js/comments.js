(function(){
  "use strict";

  var comments = [
    { initials:'M', rating:5, statusKey:'commentStatusReviewed', name:{en:'Mohammad Al-Halabi', ar:'محمد الحلبي'}, location:{en:'Aleppo', ar:'حلب'}, body:{en:'Booking took less than a minute and the pitch details were clear.', ar:'الحجز أخذ أقل من دقيقة وتفاصيل الملعب كانت واضحة.'} },
    { initials:'L', rating:5, statusKey:'commentStatusOpen', name:{en:'Laith Al-Shami', ar:'ليث الشامي'}, location:{en:'Damascus - Mezzeh', ar:'دمشق - المزة'}, body:{en:'Live availability saved us from calling every pitch in the area.', ar:'التوفر المباشر وفّر علينا الاتصال بكل ملاعب المنطقة.'} },
    { initials:'O', rating:4, statusKey:'commentStatusReviewed', name:{en:'Omar Al-Qasem', ar:'عمر القاسم'}, location:{en:'Homs', ar:'حمص'}, body:{en:'The split payment flow is the part our group uses every week.', ar:'تقسيم الدفع هو أكثر جزء نستخدمه كل أسبوع.'} }
  ];

  function currentLang(){ return window.CenterhaLanguage ? window.CenterhaLanguage.get() : 'en'; }
  function t(key){ return window.CenterhaLanguage ? window.CenterhaLanguage.t(key) : key; }

  function renderComments(){
    var target = document.getElementById('commentsList');
    if (!target) return;
    var lang = currentLang();
    target.innerHTML = comments.map(function(comment){
      return '<article class="comment-card reveal"><div class="comment-meta"><div class="comment-author"><div class="avatar">' + comment.initials + '</div><div><div class="comment-name">' + comment.name[lang] + '</div><div class="comment-location">' + comment.location[lang] + '</div></div></div><span class="status-pill">' + t(comment.statusKey) + '</span></div><div class="comment-rating">' + '★'.repeat(comment.rating) + '</div><p class="comment-body">' + comment.body[lang] + '</p></article>';
    }).join('');
  }

  document.addEventListener('centerha:languagechange', renderComments);
  renderComments();
  window.CenterhaComments = comments;
})();
