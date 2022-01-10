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
});

// TODO Add locale support
window.addEventListener('load', () => {});

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