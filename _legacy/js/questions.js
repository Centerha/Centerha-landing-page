(function(){
  "use strict";

  var questions = [
    { q:{en:'Is Centerha free to download?', ar:'هل تحميل سنطرها مجاني؟'}, a:{en:'Yes. Browsing pitches is free. You only pay when you book a pitch.', ar:'نعم. تصفح الملاعب مجاني، وتدفع فقط عند حجز ملعب.'} },
    { q:{en:'Can I cancel or reschedule?', ar:'هل يمكنني الإلغاء أو إعادة الجدولة؟'}, a:{en:'Yes, within the venue cancellation window. Refunds are processed automatically when eligible.', ar:'نعم، ضمن فترة الإلغاء الخاصة بالملعب. تتم معالجة الاسترداد تلقائيًا عند الاستحقاق.'} },
    { q:{en:'How do I add my pitch?', ar:'كيف أضيف ملعبي؟'}, a:{en:'Use the owner flow from the landing page or contact the sales team to set availability and pricing.', ar:'استخدم مسار أصحاب الملاعب من الصفحة الرئيسية أو تواصل مع فريق المبيعات لضبط المواعيد والأسعار.'} },
    { q:{en:'Which payments are supported?', ar:'ما طرق الدفع المدعومة؟'}, a:{en:'The design supports local wallets and card payments. The exact providers can be changed in the configuration.', ar:'يدعم التصميم المحافظ المحلية والبطاقات. يمكن تغيير المزودين من الإعدادات.'} }
  ];

  function currentLang(){ return window.CenterhaLanguage ? window.CenterhaLanguage.get() : 'en'; }

  function renderQuestions(){
    var target = document.getElementById('questionsList');
    if (!target) return;
    var lang = currentLang();
    target.innerHTML = questions.map(function(item, index){
      return '<article class="question-card' + (index === 0 ? ' open' : '') + '"><button class="question-button" type="button"><span>' + item.q[lang] + '</span><span class="question-icon">⌄</span></button><div class="question-answer">' + item.a[lang] + '</div></article>';
    }).join('');
    target.querySelectorAll('.question-button').forEach(function(button){
      button.addEventListener('click', function(){
        var card = button.closest('.question-card');
        var wasOpen = card.classList.contains('open');
        target.querySelectorAll('.question-card').forEach(function(item){ item.classList.remove('open'); });
        if (!wasOpen) card.classList.add('open');
      });
    });
  }

  document.addEventListener('centerha:languagechange', renderQuestions);
  renderQuestions();
  window.CenterhaQuestions = questions;
})();
