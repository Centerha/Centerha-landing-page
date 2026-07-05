(function(){
  "use strict";

  var fieldConfig = [
    { key:'name', type:'text', labelKey:'fieldName', placeholderKey:'fieldNamePlaceholder', required:true, span:'full' },
    { key:'phone', type:'tel', labelKey:'fieldPhone', placeholderKey:'fieldPhonePlaceholder', required:true },
    { key:'city', type:'select', labelKey:'fieldCity', placeholderKey:'fieldCityPlaceholder', required:true, options:[
      { en:'Damascus', ar:'دمشق' }, { en:'Aleppo', ar:'حلب' }, { en:'Homs', ar:'حمص' }, { en:'Latakia', ar:'اللاذقية' }
    ] },
    { key:'pitchType', type:'select', labelKey:'fieldPitchType', required:true, options:[
      { en:'5v5', ar:'٥ ضد ٥' }, { en:'7v7', ar:'٧ ضد ٧' }, { en:'11v11', ar:'١١ ضد ١١' }
    ] },
    { key:'date', type:'date', labelKey:'fieldDate', required:true },
    { key:'time', type:'time', labelKey:'fieldTime', required:true },
    { key:'notes', type:'textarea', labelKey:'fieldNotes', placeholderKey:'fieldNotesPlaceholder', required:false, span:'full' }
  ];

  function t(key){ return window.CenterhaLanguage ? window.CenterhaLanguage.t(key) : key; }
  function lang(){ return window.CenterhaLanguage ? window.CenterhaLanguage.get() : 'en'; }

  function fieldLabel(field){ return t(field.labelKey); }

  function renderBookingFields(){
    var target = document.getElementById('bookingFields');
    if (!target) return;
    target.innerHTML = fieldConfig.map(function(field){
      var classes = 'form-field' + (field.span === 'full' ? ' full' : '');
      var required = field.required ? ' required' : '';
      var badge = field.required ? '<span class="required-badge">' + t('requiredText') + '</span>' : '';
      var input;
      if (field.type === 'textarea') {
        input = '<textarea class="textarea" id="' + field.key + '" name="' + field.key + '" placeholder="' + t(field.placeholderKey) + '"' + required + '></textarea>';
      } else if (field.type === 'select') {
        var placeholder = '<option value="">' + (field.placeholderKey ? t(field.placeholderKey) : fieldLabel(field)) + '</option>';
        var options = field.options.map(function(option){ return '<option value="' + option.en + '">' + option[lang()] + '</option>'; }).join('');
        input = '<select class="select" id="' + field.key + '" name="' + field.key + '"' + required + '>' + placeholder + options + '</select>';
      } else {
        input = '<input class="input" id="' + field.key + '" name="' + field.key + '" type="' + field.type + '" placeholder="' + (field.placeholderKey ? t(field.placeholderKey) : '') + '"' + required + ' />';
      }
      return '<div class="' + classes + '"><label class="form-label" for="' + field.key + '"><span>' + fieldLabel(field) + '</span>' + badge + '</label>' + input + '</div>';
    }).join('');
  }

  function renderFieldTable(){
    var table = document.getElementById('fieldsTable');
    if (!table) return;
    table.innerHTML = fieldConfig.map(function(field){
      return '<tr><td><code>' + field.key + '</code></td><td>' + fieldLabel(field) + '</td><td>' + field.type + '</td><td>' + (field.required ? '<span class="status-pill">' + t('requiredText') + '</span>' : '-') + '</td></tr>';
    }).join('');
  }

  function initForm(){
    var form = document.getElementById('bookingForm');
    var message = document.getElementById('formMessage');
    if (!form) return;
    form.addEventListener('submit', function(event){
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (message) message.textContent = t('formSuccess');
    });
  }

  function initAddFieldDemo(){
    var button = document.getElementById('addDemoField');
    if (!button) return;
    button.addEventListener('click', function(){
      fieldConfig.push({ key:'custom_' + fieldConfig.length, type:'text', labelKey:'fieldNotes', required:false });
      renderFieldTable();
    });
  }

  function renderAll(){ renderBookingFields(); renderFieldTable(); }

  document.addEventListener('centerha:languagechange', renderAll);
  renderAll();
  initForm();
  initAddFieldDemo();
  window.CenterhaFields = fieldConfig;
})();
