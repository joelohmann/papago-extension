// Constants
const FONTS = ['Tahoma', 'Geneva', 'Sans-Serif'];
const PAGE_LANGS = ['en', 'ko', 'ja', 'zh-CN', 'zh-TW'];

var locale;


window.addEventListener('DOMContentLoaded', () => {
  // Load stored settings
  browser.storage.local.get({
    defFont: 'Tahoma',
    defTheme: 'auto',
    rememberLast: true,
    defTargetLang: null,
    source: null,
    target: null,
    lastSearch: null,
    lastResult: null,
    browserLang: 'en'
  })
  .then(config => {
    // Set theme 
    if (config.defTheme == 'auto') {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        // Light mode
        document.documentElement.classList.add('light');
      } else {
        // Dark mode
        document.documentElement.classList.add('dark');
      }
    } else if (config.defTheme == 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.add('dark');
    }

    // Set font
    let defFont = config.defFont == 'default' ? 'Tahoma' : config.defFont;

    document.body.style.fontFamily = defFont + ', ' + FONTS.join(', ');

    // Restore last session or set up default settings
    if (config.rememberLast) {
      let target = document.getElementById('language-target');
      if (!config.source || !config.target) {
        // DOM is already in default settings if there is no stored config
        target.value = config.browserLang;
        honorificCheck();
        return
      }

      // Restore last session
      target.value = config.target;
      honorificCheck(target.value);

      let source = document.getElementById('language-source');
      source.value = config.source;
      swapCheck();

      if (config.lastSearch) {
        let text = document.getElementById('input-text');
        text.value = config.lastSearch;
      }

      if (config.lastResult) {
        let result = document.getElementById('result-text');
        result.value = config.lastResult;
      }
    } else {
      // Using desired target language
      let target = document.getElementById('language-target');
      target.value = config.defTargetLang || config.browserLang;
      honorificCheck(target.value);
    }

    // Set global locale language
    locale = PAGE_LANGS.includes(config.browserLang) ? config.browserLang : 'en';
  })
  .catch(err => {
    console.log(err)
  });

  // Set event listeners
  let source = document.getElementById('language-source');
  source.addEventListener('change', onSourceChange);

  let target = document.getElementById('language-target');
  target.addEventListener('change', onTargetChange);

  let text = document.getElementById('input-text');
  text.addEventListener('keydown', onKeyDown);

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

  // Locales
  document.getElementById('source-auto').textContent = browser.i18n.getMessage('auto');
  document.getElementById('source-en').textContent = browser.i18n.getMessage('en');
  document.getElementById('source-ko').textContent = browser.i18n.getMessage('ko');
  document.getElementById('source-ja').textContent = browser.i18n.getMessage('ja');
  document.getElementById('source-zh-CN').textContent = browser.i18n.getMessage('zh_CN');
  document.getElementById('source-zh-TW').textContent = browser.i18n.getMessage('zh_TW');
  document.getElementById('source-vi').textContent = browser.i18n.getMessage('vi');
  document.getElementById('source-id').textContent = browser.i18n.getMessage('id');
  document.getElementById('source-th').textContent = browser.i18n.getMessage('th');
  document.getElementById('source-de').textContent = browser.i18n.getMessage('de');
  document.getElementById('source-ru').textContent = browser.i18n.getMessage('ru');
  document.getElementById('source-es').textContent = browser.i18n.getMessage('es');
  document.getElementById('source-it').textContent = browser.i18n.getMessage('it');
  document.getElementById('source-fr').textContent = browser.i18n.getMessage('fr');

  document.getElementById('target-en').textContent = browser.i18n.getMessage('en');
  document.getElementById('target-ko').textContent = browser.i18n.getMessage('ko');
  document.getElementById('target-ja').textContent = browser.i18n.getMessage('ja');
  document.getElementById('target-zh-CN').textContent = browser.i18n.getMessage('zh_CN');
  document.getElementById('target-zh-TW').textContent = browser.i18n.getMessage('zh_TW');
  document.getElementById('target-vi').textContent = browser.i18n.getMessage('vi');
  document.getElementById('target-id').textContent = browser.i18n.getMessage('id');
  document.getElementById('target-th').textContent = browser.i18n.getMessage('th');
  document.getElementById('target-de').textContent = browser.i18n.getMessage('de');
  document.getElementById('target-ru').textContent = browser.i18n.getMessage('ru');
  document.getElementById('target-es').textContent = browser.i18n.getMessage('es');
  document.getElementById('target-it').textContent = browser.i18n.getMessage('it');
  document.getElementById('target-fr').textContent = browser.i18n.getMessage('fr');

  clearButton.textContent = browser.i18n.getMessage('clear');
  document.getElementById('honorific-label').textContent = browser.i18n.getMessage('honorific');
  transButton.textContent = browser.i18n.getMessage('translate');
  copyButton.textContent = browser.i18n.getMessage('copy');

  transPage.textContent = browser.i18n.getMessage('translate_this_page');
  settings.textContent = browser.i18n.getMessage('settings');
  openNaver.textContent = browser.i18n.getMessage('open_in_papago');
  document.getElementById('donate').textContent = browser.i18n.getMessage('donate');
});

function onSourceChange(event) {
  swapCheck();

  // Reset "auto" option
  let source = event.target;
  source.options[0].textContent = browser.i18n.getMessage('auto');

  // Cannot choose a source that is the same as the target
  let target = document.getElementById('language-target');
  if (source.value == target.value) {
    target.value = source.value != 'en' ? 'en' : 'ko';
    honorificCheck(target.value);
  }
}

function onTargetChange(event) {
  let target = event.target;
  let source = document.getElementById('language-source');

  // Cannot choose a target that is the same as the source, even if the source is "auto - detected"
  if (source.value == target.value) {
    source.value = target.value != 'en' ? 'en' : 'ko';
  } else if (source.detectedLang == target.value) {
    target.value = source.detectedLang != 'en' ? 'en' : 'ko';
  }

  honorificCheck(target.value);  
}

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
  let result = document.getElementById('result-text');

  if (text.value.trim().length > 500) return result.value = browser.i18n.getMessage('max_translation_size');

  if (source.value == 'auto') {
    loading(true);

    sendDetect(target.value, text.value.trim(), honorific)
      .then(response => {
        if (response.error) throw new Error(response.message);

        source.options[source.selectedIndex].textContent = `${browser.i18n.getMessage('detected')} - ${browser.i18n.getMessage(response.message.result.srcLangType.replace('-', '_'))}`;
        source.detectedLang = response.message.result.srcLangType;

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
      .catch(err => {
        result.value = err.message;
        loading(false);
      });
  } else {
    loading(true);

    sendTranslate(source.value, target.value, text.value.trim(), honorific)
      .then(response => {
        if (response.error) throw new Error(response.message);

        result.value = response.message.result.translatedText;

        loading(false);
        storeConfig();
      })
      .catch(err => {
        result.value = err.message;
        loading(false);
      });
  }
}

// Runtime messages to background script
async function sendDetect(targetLang, text, honorific) {
  return browser.runtime.sendMessage({
    action: 'detect',
    query: `target=${targetLang}&text=${text}&honorific=${honorific}`
  })
}

async function sendTranslate(sourceLang, targetLang, text, honorific) {
  return browser.runtime.sendMessage({
    action: 'translate',
    query: `source=${sourceLang}&target=${targetLang}&text=${text}&honorific=${honorific}`
  })
}

function onKeyDown(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    event.stopPropagation();

    translateText()
  }
}

function swapLangs(event) {
  let source = document.getElementById('language-source');
  let target = document.getElementById('language-target');
  let text = document.getElementById('input-text');
  let result = document.getElementById('result-text');

  if (source.value == 'auto') {
    if (source.detectedLang) {
      // If auto is in "detected language" mode
      [source.value, target.value] = [target.value, source.detectedLang]

      source.options[0].textContent = browser.i18n.getMessage('auto');
    }
  } else {
    [source.value, target.value] = [target.value, source.value];
  }

  if (result.value) {
    [text.value, result.value] = [result.value, text.value];
  }

  honorificCheck(target.value);
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
  let sourceLang = PAGE_LANGS.includes(source.value) ? source.value : 'ko';

  let target = document.getElementById('language-target');
  let targetLang = PAGE_LANGS.includes(target.value) ? target.value : 'en';

  browser.tabs.query({
    currentWindow: true,
    active: true
  })
  .then(tabs => {
    browser.tabs.create({
      url: `https://papago.naver.net/website?locale=${locale}&source=${sourceLang}&target=${targetLang}&url=${encodeURIComponent(tabs[0].url)}`
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
    honorific.style.display = 'flex';
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
  let copyButton = document.getElementById('copy-button');

  let div = document.createElement('div');
  div.textContent = "- " + browser.i18n.getMessage('copied');
  div.style = 'position: absolute; animation: fade 2s ease-in;';

  console.log(copyButton.offsetLeft, copyButton.offsetWidth);
  div.style.left = copyButton.offsetLeft + (copyButton.offsetWidth / 2) + 5 + 'px';
  div.style.top = copyButton.offsetTop + 4 + 'px';

  copyButton.parentElement.insertBefore(div, copyButton);
  setTimeout(() => div.remove(), 1900);
}
