document.addEventListener('DOMContentLoaded', () => {
  var defTargetLang = document.getElementsByName('default-target')[0];
  defTargetLang.addEventListener('change', storeConfig);

  var defFont = document.getElementsByName('default-font')[0];
  defFont.addEventListener('change', storeConfig);

  var defTheme = document.getElementsByName('default-theme')[0];
  defTheme.addEventListener('change', storeConfig);

  var usePopup = document.getElementsByName('use-popup')[0];
  usePopup.addEventListener('change', storeConfig);

  var phraseSelect = document.getElementsByName('phrase-select')[0];
  phraseSelect.addEventListener('change', storeConfig);

  browser.storage.local.get(['rememberLast', 'defTargetLang', 'defFont', 'defTheme', 
  'usePopup', 'phraseSelect', 'popupBehavior'
  ], config => {
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

    if (config.usePopup != null) {
      usePopup.checked = config.usePopup;
      popupDisplay(config.usePopup);
    }

    if (config.phraseSelect != null) phraseSelect.value = config.phraseSelect;

    var popupDisplaylist = document.getElementsByName('popup-display');
    for (i = 0; i < popupDisplaylist.length; i++) {
      popupDisplaylist[i].addEventListener('change', storeConfig);
      if (config.popupBehavior != null) {
        popupDisplaylist[i].checked = (popupDisplaylist[i].value == config.popupBehavior);
      }
    }
  });

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

  document.getElementById('popup-options-title').textContent = browser.i18n.getMessage('popup_options');
  document.getElementById('use-popup-label').textContent = browser.i18n.getMessage('use_popup');
  
  document.getElementById('phrase-select-label').textContent = browser.i18n.getMessage('phrase_select');
  document.getElementById('drag').textContent = browser.i18n.getMessage('drag');
  document.getElementById('ctrl-drag').textContent = browser.i18n.getMessage('ctrl_drag');
  document.getElementById('alt-drag').textContent = browser.i18n.getMessage('alt_drag');

  document.getElementById('popup-behavior-title').textContent = browser.i18n.getMessage('popup_behavior');
  document.getElementById('popup-display-icon-label').textContent = browser.i18n.getMessage('popup_display_icon');
  document.getElementById('popup-display-instant-label').textContent = browser.i18n.getMessage('popup_display_instant');

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

  var usePopup = document.getElementsByName('use-popup')[0].checked;
  popupDisplay(usePopup);
  newConfig['usePopup'] = usePopup;
  if (usePopup) {
    var phraseSelect = document.getElementsByName('phrase-select')[0].value;
    newConfig['phraseSelect'] = phraseSelect;

    var popupDisplayList = document.getElementsByName('popup-display');
    for (i = 0; i < popupDisplayList.length; i++) {
      if (popupDisplayList[i].checked) {
        var popupBehavior = popupDisplayList[i].value;
        newConfig['popupBehavior'] = popupBehavior;
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

function popupDisplay(bool) {
  var popupOptions = document.getElementById('popup-options');
  if (bool) {
    popupOptions.style.display = 'block';
  } else {
    popupOptions.style.display = 'none';
  }
}