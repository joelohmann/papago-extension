// TODO Check for options first. They supercede any 'previous search' config
// TODO Add eventListeners
document.addEventListener('DOMContentLoaded', () => {
  browser.storage.local.get(['defFont', 'defTheme'], config => {
    if (config.defFont) document.body.style.fontFamily = config.defFont;

    if (config.defTheme) {}
  })

  let source = document.getElementById('language-source');
  source.addEventListener('change', onSourceChange);

  let target = document.getElementById('language-target');
  target.addEventListener('change', onTargetChange);

  let transButton = document.getElementById('translate-button');
  transButton.addEventListener('click', translateText);

  let swapButton = document.getElementById('swap-button');
  swapButton.addEventListener('click', swapLangs);

  let clearButton = document.getElementById('clear-button');
  clearButton.addEventListener('click', clearText);

  let copyButton = document.getElementById('copy-button');
  copyButton.addEventListener('click', copyText);

  let honorButton = document.getElementById('honorific-button');
  honorButton.addEventListener('click', honorificToggle);

  let transPage = document.getElementById('transPage');
  transPage.addEventListener('click', translatePage);

  let settings = document.getElementById('settings');
  settings.addEventListener('click', openOptionsPage);

  let openNaver = document.getElementById('openNaver');
  openNaver.addEventListener('click', openNaverSite);
})

// TODO Add locale support for source/target languages (for loop that sets each option.text)
window.addEventListener('load', () => {
  browser.storage.local.get(['rememberLast', 'defTargetLang', 'source', 'target', 'lastSearch', 'lastResult'], config => {
    if (config.rememberLast != false) {
      // DOM is already in default settings if there is no stored config
      if (!config.source || !config.target) return;

      let source = document.getElementById('language-source');
      source.value = config.source;
      swapCheck();

      let target = document.getElementById('language-target');
      target.value = config.target;
      honorificCheck(target.value);

      let text = document.getElementById('input-text');
      if (config.lastSearch) text.value = config.lastSearch;

      let result = document.getElementById('result-text');
      if (config.lastResult) result.value = config.lastResult;
    } else {
      let target = document.getElementById('language-target');
      if (config.defTargetLang) target.value = config.defTargetLang;
    }
  })
})

function onSourceChange(event) {
  swapCheck();

  let source = this;
  source.options[0].textContent = browser.i18n.getMessage('auto');

  // Cannot choose a source that is the same as the target
  let target = document.getElementById('language-target');
  if (source.value == target.value) {
    target.value = source.value == 'en' ? 'ko' : 'en';
    honorificCheck(target.value);
  }

  storeConfig();
}

function onTargetChange(event) {
  let target = this;
  let source = document.getElementById('language-source');

  // Cannot choose a target that is the same as the source, even if the source is "auto - detected"
  if (source.value == target.value) {
    source.value = target.value == 'en' ? 'ko' : 'en';
  } else if (source.detectedLang == target.value) {
    target.value = source.detectedLang == 'en' ? 'ko' : 'en';
  }

  honorificCheck(target.value);
  storeConfig();
}

// TODO Add caching for a few last results
function translateText(event) {
  let text = document.getElementById('input-text');
  if (!text.value) return;

  let honorButton = document.getElementById('honorific-button');
  let honorific = 'false';
  if (honorButton) {
    if (honorButton.className.includes('on')) honorific = 'true';
  }

  // Check if language detection API needs to be used prior to translation.
  let source = document.getElementById('language-source');
  let target = document.getElementById('language-target');
  if (source.value == 'auto') {
    loading(true);

    sendDetect(target.value, text.value.trim(), honorific)
      .then(response => {
        source.options[source.selectedIndex].textContent = `${browser.i18n.getMessage('detected')} - ${browser.i18n.getMessage(response.message.result.srcLangType.replace('-', '_'))}`;
        source.detectedLang = response.message.result.srcLangType;

        let result = document.getElementById('result-text');
        result.value = response.message.result.translatedText;

        let swapButton = document.getElementById('swap-button');
        swapButton.style.display = 'inherit';

        if (response.message.result.tarLangType != target.value) {
          target.value = response.message.result.tarLangType;
          honorificCheck(target.value);
        }

        loading(false);
        storeConfig();
      })
      .catch(err => console.log(err))
  } else {
    loading(true);

    sendTranslate(source.value, target.value, text.value.trim(), honorific)
      .then(response => {
        let result = document.getElementById('result-text');
        result.value = response.message.result.translatedText;

        loading(false);
        storeConfig();
      })
      .catch(err => console.log(err))
  }
}

// Runtime messages to background script
async function sendDetect(targetLang, text, honorific) {
  return browser.runtime.sendMessage({
    action: 'detect',
    detectBody: {
      'query': text
    },
    body: {
      'source': "",
      'target': targetLang,
      'text': text,
      'honorific': honorific
    }
  })
}

async function sendTranslate(sourceLang, targetLang, text, honorific) {
  return browser.runtime.sendMessage({
    action: 'translate',
    body: {
      'source': sourceLang,
      'target': targetLang,
      'text': text,
      'honorific': honorific
    }
  })
}

function swapLangs(event) {
  let source = document.getElementById('language-source');
  let target = document.getElementById('language-target');

  if (source.value == 'auto') {
    if (source.detectedLang) {
      // If auto is in "detected language" mode
      [source.value, target.value] = [target.value, source.detectedLang]

      source.options[0].textContent = browser.i18n.getMessage('auto');
    }
  } else {
    [source.value, target.value] = [target.value, source.value];
  }

  let text = document.getElementById('input-text');
  let result = document.getElementById('result-text');
  [text.value, result.value] = [result.value, text.value];

  honorificCheck(target.value);
  storeConfig();
}

function clearText(event) {
  let text = document.getElementById('input-text');
  let result = document.getElementById('result-text');

  text.value = result.value = '';
  storeConfig();
}

function copyText(event) {
  let result = document.getElementById('result-text');
  navigator.clipboard.writeText(result.value);
  copied();
}

function honorificToggle(event) {
  let honorButton = document.getElementById('honorific-button');

  if (honorButton.className.includes('on')) {
    honorButton.className = honorButton.className.replace('on', 'off');
  } else {
    honorButton.className = honorButton.className.replace('off', 'on')
  }
}

function translatePage(event) {
  let source = document.getElementById('language-source');
  let target = document.getElementById('language-target');

  browser.tabs.query({
    currentWindow: true,
    active: true
  }, tabs => {
    browser.tabs.create({
      url: `https://papago.naver.net/website?source=${source.value}&target=${target.value}&url=${tabs[0].url}`
    })
  })
}

function openOptionsPage(event) {
  browser.tabs.create({
    url: "../options/options.html"
  });
}

function openNaverSite(event) {
  let source = document.getElementById('language-source');
  let target = document.getElementById('language-target');
  let text = document.getElementById('input-text');

  browser.tabs.create({
    url: `https://papago.naver.com/?sk=${source.value}&tk=${target.value}&hn=1&st=${text.value}`
  });
}

function swapCheck() {
  let source = document.getElementById('language-source');
  let swapButton = document.getElementById('swap-button');

  if (source.value == 'auto') {
    swapButton.style.display = 'none';
  } else {
    // If any source other than auto, need to make sure Auto and the swap button are in their default states
    swapButton.style.display = 'inherit';
  }
}

// This should be called any time the target language has the possibilty of changing to Korean
function honorificCheck(target) {
  let honorific = document.getElementById('honorific');
  if (target == 'ko') {
    honorific.style.display = 'inherit';
  } else {
    honorific.style.display = 'none';
  }
}

// Stores the state of each element in local storage
function storeConfig() {
  let source = document.getElementById('language-source');
  let target = document.getElementById('language-target');
  let text = document.getElementById('input-text');
  let result = document.getElementById('result-text');

  let newConfig = {};

  newConfig['source'] = source.value;
  newConfig['target'] = target.value;
  newConfig['lastSearch'] = text.value;
  newConfig['lastResult'] = result.value;

  browser.storage.local.set(newConfig);
}

// Blur and prevent clicking while showing the loading animation
function loading(bool) {
  let blur = document.getElementById('blur');
  let loader = document.getElementById('loader');

  if (bool) {
    blur.style.filter = 'blur(1px)';
    loader.style.display = 'flex';
  } else {
    blur.style.filter = 'none';
    loader.style.display = 'none';
  }
}

function copied() {
  let div = document.createElement('div');
  div.textContent = "- Copied!";
  div.style = 'position: absolute; left: 50%; transform: translateX(50%); animation: fade 2s ease-in;';

  let copyButton = document.getElementById('copy-button');
  copyButton.parentElement.insertBefore(div, copyButton);
  setTimeout(() => div.remove(), 1900);
}