// Constants
const SELECTION_CHECK = /^[0-9\s\$\^\&\]\[\/\\!@#<>%*)('"{};:?|+=.,_-]+$/;
const FONTS = ['Tahoma', 'Geneva', 'Sans-Serif'];
const LANGS = ['en', 'ko', 'ja', 'zh', 'vi', 'id', 'th', 'de', 'ru', 'es', 'it', 'fr'];

// Options variables
var useInline, phraseSelect, inlineBehavior;

// Global variables
var dragging = false;
var selectionReady = false;
var keyPressed = false;
var selection, selectedText, selectedLang;

var icon, inline;


// TODO: Add default target language setting to inline init
document.addEventListener('DOMContentLoaded', () => {
  // Checking if script has already been injected
  if (document.getElementsByClassName('papagoExt-icon').length > 0 
    && document.getElementsByClassName('papagoExt-inline').length > 0) return;

  browser.storage.local.get(['defFont', 'defTheme', 'useInline', 'phraseSelect', 'inlineBehavior'], config => {
    let defFont = (config.defFont && config.defFont != 'default') ? config.defFont : 'Tahoma';
    let defTheme = config.defTheme ? config.defTheme : 'auto';

    useInline = (config.useInline !== undefined) ? config.useInline : true;
    phraseSelect = config.phraseSelect ? config.phraseSelect : 'drag';
    inlineBehavior = config.inlineBehavior ? config.inlineBehavior : 'icon';

    // If inline is disabled, then nothing will happen to the page
    if (useInline) {
      icon = createIcon();
      inline = createInline();

      window.addEventListener('mousedown', mouseDown);
      window.addEventListener('mouseup', mouseUp);

      document.addEventListener('selectionchange', selectionChange);
      document.addEventListener('keydown', keyDown);
      document.addEventListener('keyup', keyUp);

      // Set font
      inline.style.fontFamily = defFont + ', ' + FONTS.join(', ');

      // Set theme 
      if (defTheme == 'auto') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
          // Light mode
          inline.classList.add('light');
        } else {
          // Dark mode
          inline.classList.add('dark');
        }
      } else if (defTheme == 'light') {
        inline.classList.add('light');
      } else {
        inline.classList.add('dark');
      }
    }
  });
});

function mouseDown(event) {
  if (icon.contains(event.target) || inline.contains(event.target)) return;

  selection = selectedText = selectedLang = null;
  hideIcon();
  hideInline();

  dragging = true;
}

function mouseUp(event) {
  if (icon.contains(event.target) || inline.contains(event.target)) return;

  if (selectionReady) {
    inlineBehavior === 'icon' ? showIcon(event) : showInline();

    selectionReady = false;
  }

  dragging = false;
}

function selectionChange() {
  let tempSelection = window.getSelection();
  let tempText = tempSelection.toString();

  if (tempText.length > 0 && !SELECTION_CHECK.test(tempText)) {
    if (phraseSelect === 'drag' || keyPressed) {
      if (dragging) {
        // Selection check passed: store selection
        selection = window.getSelection();
        selectedText = selection.toString();

        // Mouse is held down. Pass showing icon/inline to mouseup event
        selectionReady = true;
        return;
      } 
    }
  }
  // Selection check failed or drag condition wasn't met
  selectionReady = false;
}

function keyDown(event) {
  if (phraseSelect !== 'drag') {
    if (phraseSelect === 'alt-drag' && event.keyCode === 18) {
      keyPressed = true;
    } else if (phraseSelect === 'ctrl-drag' && event.keyCode === 17) {
      keyPressed = true;
    } else {
      keyPressed = false;
    }
  }
}

function keyUp(event) {
  if (phraseSelect === 'alt-drag' && event.keyCode === 18) {
    keyPressed = false;
  } else if (phraseSelect === 'ctrl-drag' && event.keyCode === 17) {
    keyPressed = false;
  }
}

function createIcon() {
  let container = document.createElement('div');
  container.className = 'papagoExt-icon';

  let image = document.createElement('div');
  image.style = `background-image: url(${browser.runtime.getURL('icons/19.png')}); height: 19px; width: 19px;`;

  container.appendChild(image);
  document.body.appendChild(container);

  container.addEventListener('mousedown', event => {
    event.preventDefault();
    event.stopPropagation();
  });
  container.addEventListener('click', showInline);

  return container;
}

function createInline() {
  let container = document.createElement('div');
  container.className = 'papagoExt-inline';

  let path = browser.runtime.getURL('content/content.html');
  readFile(path, (res) => {
    container.innerHTML = res;
    document.body.appendChild(container);
  
    let target = document.getElementById('papagoExt-language-target');
    target.addEventListener('change', setResult);
    if (LANGS.includes(navigator.language.substring(0, 2))) {
      target.value = navigator.language.substring(0, 2);
    }

    let copyButton = document.getElementById('papagoExt-copy-button');
    copyButton.addEventListener('click', copyText);

    // Locales
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

    copyButton.textContent = browser.i18n.getMessage('copy');
  });

  return container;
}

function showIcon(event) {
  let rect = selection.getRangeAt(0).getBoundingClientRect();

  let offset, top, left;

  offset = event.clientY > (rect.top + rect.bottom) / 2 ? rect.bottom - 1 : rect.top + 1 - 27;
  top = offset + getPageYOffset();

  if (top < getPageYOffset()) {
    top = 5;
  } else if (top > (window.innerHeight - 27 + getPageYOffset())) {
    top = window.innerHeight - 5 - 27 + getPageYOffset();
  }

  offset = event.clientX > (rect.left + rect.right) / 2 ? -28 : 1;
  left = event.clientX + offset + getPageXOffset();

  icon.style.top = top + "px";
  icon.style.left = left + "px";
  icon.style.display = 'block';

  setTimeout(() => {icon.style.display = 'none'}, 20000);
}

function hideIcon() {
  icon.style.display = 'none';
}

function showInline() {
  hideIcon();

  setResult();

  let rect = selection.getRangeAt(0).getBoundingClientRect();

  let top = getPageYOffset();
  if ((rect.bottom + rect.top) < window.innerHeight) {
    // Selection is in the top half of screen
    top += rect.bottom + 5;
  } else {
    // Selection is in bottom half of screen.
    top += rect.top - 5 - 125;
  }

  let left = ((rect.right + rect.left) / 2) - 175 + getPageXOffset();

  // Check if inline will be off screen.
  if (left > (window.innerWidth - 350 + getPageXOffset())) {
    left = window.innerWidth - 25 - 350 + getPageXOffset();
  } else if (left < (10 + getPageXOffset())) {
    left = 10 + getPageXOffset();
  }

  inline.style.top = top + "px";
  inline.style.left = left + "px";
  inline.style.display = 'block';
}

function hideInline() {
  inline.style.display = 'none';

  let result = document.getElementById('papagoExt-result-text');
  result.value = '';
}

// Blur and prevent clicking while showing the loading animation
function loading(bool) {
  let blur = document.getElementById('papagoExt-blur');
  let loader = document.getElementById('papagoExt-loader');

  if (bool) {
    blur.style.filter = 'blur(1px)';
    loader.style.display = 'flex';
  } else {
    blur.style.filter = 'none';
    loader.style.display = 'none';
  }
}

function setResult() {
  let target = document.getElementById('papagoExt-language-target');
  let result = document.getElementById('papagoExt-result-text');

  // Check if source languange is known already
  if (selectedLang) {
    if (selectedLang === target.value) {
      return result.value = selectedText;
    }

    loading(true);

    sendTranslate(selectedLang, target.value, selectedText)
    .then(response => {
      if (!response.message) throw new Error(response);
  
      result.value = response.message.result.translatedText;
  
      loading(false);
    })
    .catch(err => {
      result.value = err.message;
      loading(false);
    });
  } else {
    // Source language needs to be detected
    loading(true);

    sendDetect(target.value, selectedText)
    .then(response => {
      if (!response.message) throw new Error(response);

      result.value = response.message.result.translatedText;
      selectedLang = response.message.result.srcLangType;

      if (response.message.result.tarLangType !== target.value) {
        target.value = response.message.result.tarLangType;
      }

      loading(false);
    })
    .catch(err => {
      result.value = err.message;
      loading(false);
    });
  }
}

function copyText() {
  let result = document.getElementById('papagoExt-result-text');
  navigator.clipboard.writeText(result.value);
  copied(this);
}

function copied(copyButton) {
  let div = document.createElement('div');
  div.textContent = browser.i18n.getMessage('copied');
  div.style = 'overflow: hidden; transform: translateX(15px); animation: fade 2s ease-in;';

  copyButton.parentElement.insertBefore(div, copyButton);
  setTimeout(() => div.remove(), 1900);
}

// Runtime messages to background script
async function sendTranslate(sourceLang, targetLang, text) {
  return browser.runtime.sendMessage({
    action: 'translate',
    query: `source=${sourceLang}&target=${targetLang}&text=${text}&honorific=true`
  })
}

async function sendDetect(targetLang, text) {
  return browser.runtime.sendMessage({
    action: 'detect',
    query: `target=${targetLang}&text=${text}&honorific=true`
  })
}

// For loading html files
function readFile(path, callback){
  fetch(path, {mode:'same-origin'})
  .then(function(res) {
      return res.blob();
  })
  .then(function(blob) {
      let reader = new FileReader();

      reader.addEventListener("loadend", function() {
          callback(this.result);
      });

      reader.readAsText(blob); 
  });
};

function getPageXOffset() {
  return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
};

function getPageYOffset() {
  return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
};
