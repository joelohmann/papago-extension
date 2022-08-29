document.addEventListener('DOMContentLoaded', () => {
  var defTargetLang = document.getElementsByName('default-target')[0];
  defTargetLang.addEventListener('change', storeConfig);

  var defFont = document.getElementsByName('default-font')[0];
  defFont.addEventListener('change', storeConfig);

  var defTheme = document.getElementsByName('default-theme')[0];
  defTheme.addEventListener('change', storeConfig);

  var useInline = document.getElementsByName('use-inline')[0];
  useInline.addEventListener('change', storeConfig);

  var phraseSelect = document.getElementsByName('phrase-select')[0];
  phraseSelect.addEventListener('change', storeConfig);

  browser.storage.local.get([
    'rememberLast', 
    'defTargetLang', 
    'defFont', 
    'defTheme', 
    'useInline', 
    'phraseSelect', 
    'inlineBehavior'
  ])
  .then(config => {
    var useDefaultsList = document.getElementsByName('translation-defaults');
    for (i = 0; i < useDefaultsList.length; i++) {
      useDefaultsList[i].addEventListener('change', storeConfig);
      if (config.rememberLast != null) {
        useDefaultsList[i].checked = (useDefaultsList[i].value == config.rememberLast.toString());
        translationDisplay(config.rememberLast)
      }
    }

    if (config.defTargetLang != null) defTargetLang.value = config.defTargetLang;

    if (config.defFont != null) defFont.value = config.defFont;

    if (config.defTheme != null) defTheme.value = config.defTheme;

    if (config.useInline != null) {
      useInline.checked = config.useInline;
      inlineDisplay(config.useInline);
    }

    if (config.phraseSelect != null) phraseSelect.value = config.phraseSelect;

    var inlineDisplaylist = document.getElementsByName('inline-display');
    for (i = 0; i < inlineDisplaylist.length; i++) {
      inlineDisplaylist[i].addEventListener('change', storeConfig);
      if (config.inlineBehavior != null) {
        inlineDisplaylist[i].checked = (inlineDisplaylist[i].value == config.inlineBehavior);
      }
    }
  })
  .catch(err => {console.log(err)});

  // Locales
  document.getElementById('translation-defaults-title').textContent = browser.i18n.getMessage('translation_defaults');
  
  document.getElementById('remember-last-label').textContent = browser.i18n.getMessage('remember_last');
  
  document.getElementById('use-defaults-label').textContent = browser.i18n.getMessage('use_default');
  
  document.getElementById('default-target-label').textContent = browser.i18n.getMessage('default_target');
  document.getElementById('en').textContent = browser.i18n.getMessage('en');
  document.getElementById('ko').textContent = browser.i18n.getMessage('ko');
  document.getElementById('ja').textContent = browser.i18n.getMessage('ja');
  document.getElementById('zh-CN').textContent = browser.i18n.getMessage('zh_CN');
  document.getElementById('zh-TW').textContent = browser.i18n.getMessage('zh_TW');
  document.getElementById('vi').textContent = browser.i18n.getMessage('vi');
  document.getElementById('id').textContent = browser.i18n.getMessage('id');
  document.getElementById('th').textContent = browser.i18n.getMessage('th');
  document.getElementById('de').textContent = browser.i18n.getMessage('de');
  document.getElementById('ru').textContent = browser.i18n.getMessage('ru');
  document.getElementById('es').textContent = browser.i18n.getMessage('es');
  document.getElementById('it').textContent = browser.i18n.getMessage('it');
  document.getElementById('fr').textContent = browser.i18n.getMessage('fr');

  document.getElementById('default-font-label').textContent = browser.i18n.getMessage('default_font');
  document.getElementById('default').textContent = browser.i18n.getMessage('default');

  document.getElementById('default-theme-label').textContent = browser.i18n.getMessage('default_theme');
  document.getElementById('auto').textContent = browser.i18n.getMessage('auto_detect');
  document.getElementById('light').textContent = browser.i18n.getMessage('light');
  document.getElementById('dark').textContent = browser.i18n.getMessage('dark');

  document.getElementById('inline-options-title').textContent = browser.i18n.getMessage('inline_options');
  document.getElementById('use-inline-label').textContent = browser.i18n.getMessage('use_inline');
  
  document.getElementById('phrase-select-label').textContent = browser.i18n.getMessage('phrase_select');
  document.getElementById('drag').textContent = browser.i18n.getMessage('drag');
  document.getElementById('ctrl-drag').textContent = browser.i18n.getMessage('ctrl_drag');
  document.getElementById('alt-drag').textContent = browser.i18n.getMessage('alt_drag');

  document.getElementById('inline-behavior-title').textContent = browser.i18n.getMessage('inline_behavior');
  document.getElementById('inline-display-icon-label').textContent = browser.i18n.getMessage('inline_display_icon');
  document.getElementById('inline-display-instant-label').textContent = browser.i18n.getMessage('inline_display_instant');

  document.getElementById('footer').textContent = browser.i18n.getMessage('footer');
});

function storeConfig(event) {
  var newConfig = {};

  var defFont = document.getElementsByName('default-font')[0].value;
  newConfig['defFont'] = defFont;

  var defTheme = document.getElementsByName('default-theme')[0].value;
  newConfig['defTheme'] = defTheme;

  var useDefaultsList = document.getElementsByName('translation-defaults');
  for (i = 0; i < useDefaultsList.length; i++) {
    if (useDefaultsList[i].checked) {
      var rememberLast = (useDefaultsList[i].value == 'true');
      translationDisplay(rememberLast);
      newConfig['rememberLast'] = rememberLast;

      var defTargetLang = document.getElementsByName('default-target')[0].value;
      newConfig['defTargetLang'] = defTargetLang;
    }
  }

  var useInline = document.getElementsByName('use-inline')[0].checked;
  inlineDisplay(useInline);
  newConfig['useInline'] = useInline;
  if (useInline) {
    var phraseSelect = document.getElementsByName('phrase-select')[0].value;
    newConfig['phraseSelect'] = phraseSelect;

    var inlineDisplayList = document.getElementsByName('inline-display');
    for (i = 0; i < inlineDisplayList.length; i++) {
      if (inlineDisplayList[i].checked) {
        var inlineBehavior = inlineDisplayList[i].value;
        newConfig['inlineBehavior'] = inlineBehavior;
      }
    }
  }

  browser.storage.local.set(newConfig);
}

function translationDisplay(bool) {
  var translationOptions = document.getElementById('translation-options');
  if (bool) {
    translationOptions.style.display = 'none';
  } else {
    translationOptions.style.display = 'block';
  }
}

function inlineDisplay(bool) {
  var inlineOptions = document.getElementById('inline-options');
  if (bool) {
    inlineOptions.style.display = 'block';
  } else {
    inlineOptions.style.display = 'none';
  }
}
