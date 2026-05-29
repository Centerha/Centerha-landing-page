window.CenterhaTranslations = {
  en: {
    brand: "Centerha",
    navHome: "Home",
    navForm: "Form",
    navFields: "Fields",
    navComments: "Comments",
    navQuestions: "Questions",
    downloadApp: "Download App",
    pageFormEyebrow: "Booking form",
    pageFormTitle: "Create a clean pitch booking request.",
    pageFormLead: "This form is rendered from one field configuration, so adding or editing inputs stays simple.",
    submitButton: "Submit request",
    resetButton: "Reset",
    fieldName: "Full name",
    fieldNamePlaceholder: "Your name",
    fieldPhone: "Phone number",
    fieldPhonePlaceholder: "+963 9xx xxx xxx",
    fieldCity: "City",
    fieldCityPlaceholder: "Choose a city",
    fieldPitchType: "Pitch type",
    fieldDate: "Preferred date",
    fieldTime: "Preferred time",
    fieldNotes: "Notes",
    fieldNotesPlaceholder: "Team size, preferred area, or special requests",
    requiredText: "Required",
    formSuccess: "Request saved locally for review.",
    pageFieldsEyebrow: "Field manager",
    pageFieldsTitle: "Manage form fields without digging through markup.",
    pageFieldsLead: "The table below mirrors the field configuration used by the form page.",
    fieldKey: "Key",
    fieldLabel: "Label",
    fieldType: "Type",
    fieldRequired: "Required",
    addFieldButton: "Add field",
    pageCommentsEyebrow: "Feedback",
    pageCommentsTitle: "Player comments and venue feedback.",
    pageCommentsLead: "Reusable comment cards keep feedback easy to scan and edit.",
    commentStatusOpen: "Open",
    commentStatusReviewed: "Reviewed",
    pageQuestionsEyebrow: "Questions",
    pageQuestionsTitle: "Frequently asked questions.",
    pageQuestionsLead: "Questions are rendered from one array in questions.js for easier editing.",
    footerText: "Find, book, and play. The fastest way to get on a football pitch in Syria.",
    rights: "All rights reserved.",
    madeInSyria: "Made in Syria"
  },
  ar: {
    brand: "سنطرها",
    navHome: "الرئيسية",
    navForm: "النموذج",
    navFields: "الحقول",
    navComments: "التعليقات",
    navQuestions: "الأسئلة",
    downloadApp: "نزّل التطبيق",
    pageFormEyebrow: "نموذج الحجز",
    pageFormTitle: "أنشئ طلب حجز ملعب بشكل مرتب.",
    pageFormLead: "يتم إنشاء النموذج من إعدادات حقول واحدة، لذلك تبقى إضافة المدخلات أو تعديلها بسيطة.",
    submitButton: "إرسال الطلب",
    resetButton: "إعادة ضبط",
    fieldName: "الاسم الكامل",
    fieldNamePlaceholder: "اسمك",
    fieldPhone: "رقم الهاتف",
    fieldPhonePlaceholder: "+963 9xx xxx xxx",
    fieldCity: "المدينة",
    fieldCityPlaceholder: "اختر مدينة",
    fieldPitchType: "نوع الملعب",
    fieldDate: "التاريخ المفضل",
    fieldTime: "الوقت المفضل",
    fieldNotes: "ملاحظات",
    fieldNotesPlaceholder: "عدد اللاعبين، المنطقة المفضلة، أو أي طلب خاص",
    requiredText: "مطلوب",
    formSuccess: "تم حفظ الطلب محليًا للمراجعة.",
    pageFieldsEyebrow: "إدارة الحقول",
    pageFieldsTitle: "أدِر حقول النموذج بدون البحث داخل القالب.",
    pageFieldsLead: "يعرض الجدول أدناه نفس إعدادات الحقول المستخدمة في صفحة النموذج.",
    fieldKey: "المفتاح",
    fieldLabel: "العنوان",
    fieldType: "النوع",
    fieldRequired: "مطلوب",
    addFieldButton: "إضافة حقل",
    pageCommentsEyebrow: "التغذية الراجعة",
    pageCommentsTitle: "تعليقات اللاعبين وملاحظات الملاعب.",
    pageCommentsLead: "بطاقات التعليقات القابلة لإعادة الاستخدام تجعل الملاحظات سهلة القراءة والتعديل.",
    commentStatusOpen: "مفتوح",
    commentStatusReviewed: "تمت المراجعة",
    pageQuestionsEyebrow: "الأسئلة",
    pageQuestionsTitle: "الأسئلة الشائعة.",
    pageQuestionsLead: "يتم عرض الأسئلة من مصفوفة واحدة في questions.js لتسهيل التعديل.",
    footerText: "لاقِ، احجز، والعب. أسرع طريقة توصلك عالملعب في سوريا.",
    rights: "جميع الحقوق محفوظة.",
    madeInSyria: "صُنع في سوريا"
  }
};

(function(){
  "use strict";

  function getSavedLanguage(){
    try { return localStorage.getItem('centerha-lang') || 'en'; }
    catch(e){ return 'en'; }
  }

  function translateElement(el, lang){
    var key = el.dataset.i18n;
    var value = window.CenterhaTranslations[lang] && window.CenterhaTranslations[lang][key];
    if (value !== undefined) el.textContent = value;
  }

  function translateAttributes(el, lang){
    ['placeholder', 'ariaLabel', 'title'].forEach(function(name){
      var key = el.dataset['i18n' + name.charAt(0).toUpperCase() + name.slice(1)];
      if (!key) return;
      var value = window.CenterhaTranslations[lang] && window.CenterhaTranslations[lang][key];
      if (value === undefined) return;
      var attr = name === 'ariaLabel' ? 'aria-label' : name;
      el.setAttribute(attr, value);
    });
  }

  function applyLanguage(lang){
    var isAr = lang === 'ar';
    document.documentElement.lang = isAr ? 'ar' : 'en';
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach(function(el){ translateElement(el, lang); });
    document.querySelectorAll('[data-i18n-placeholder], [data-i18n-aria-label], [data-i18n-title]').forEach(function(el){ translateAttributes(el, lang); });

    document.querySelectorAll('.lang-pill').forEach(function(pill){
      pill.classList.toggle('ar', isAr);
      pill.querySelectorAll('button').forEach(function(button){
        button.classList.toggle('on', button.dataset.lang === lang);
      });
    });

    try { localStorage.setItem('centerha-lang', lang); } catch(e){}
    document.dispatchEvent(new CustomEvent('centerha:languagechange', { detail: { lang: lang } }));
  }

  function initLanguage(){
    document.querySelectorAll('.lang-pill button').forEach(function(button){
      button.addEventListener('click', function(){ applyLanguage(button.dataset.lang); });
    });
    applyLanguage(getSavedLanguage());
  }

  window.CenterhaLanguage = {
    get: getSavedLanguage,
    set: applyLanguage,
    t: function(key, lang){
      var selected = lang || getSavedLanguage();
      return (window.CenterhaTranslations[selected] && window.CenterhaTranslations[selected][key]) || key;
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initLanguage);
  else initLanguage();
})();
