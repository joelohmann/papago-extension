// Constants
const SELECTION_CHECK = /^[0-9\s\$\^\&\]\[\/\\!@#<>%*)('"{};:?|+=.,_-]+$/;
const FONTS = ['Tahoma', 'Geneva', 'Sans-Serif'];

// Options variables
var usePopup, phraseSelect, popupBehavior;

// Global variables
var dragging = false;
var selectionReady = false;
var keyPressed = false;
var selection;

var icon, popup;


document.addEventListener('DOMContentLoaded', () => {
  browser.storage.local.get(['defFont', 'defTheme', 'usePopup', 'phraseSelect', 'popupBehavior'], config => {
    let defFont = (config.defFont && config.defFont != 'default') ? config.defFont : 'Tahoma';
    let defTheme = config.defTheme ? config.defTheme : 'auto';

    usePopup = (config.usePopup !== undefined) ? config.usePopup : true;
    phraseSelect = config.phraseSelect ? config.phraseSelect : 'drag';
    popupBehavior = config.popupBehavior ? config.popupBehavior : 'icon';

    // If popup is disabled, then nothing will happen to the page
    if (usePopup) {
      icon = createIcon();
      popup = createPopup();

      window.addEventListener('mousedown', mouseDown);
      window.addEventListener('mouseup', mouseUp);

      document.addEventListener('selectionchange', selectionChange);
      document.addEventListener('keydown', keyDown);
      document.addEventListener('keyup', keyUp);

      // Set font
      popup.style.fontFamily = defFont + ', ' + FONTS.join(', ');

      // Set theme 
      if (defTheme == 'auto') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
          // Light mode
          popup.classList.add('light');
        } else {
          // Dark mode
          popup.classList.add('dark');
        }
      } else if (defTheme == 'light') {
        popup.classList.add('light');
      } else {
        popup.classList.add('dark');
      }
    }
  });
});

function mouseDown(event) {
  if (icon.contains(event.target) || popup.contains(event.target)) return;

  selection = null;
  hideIcon();
  hidePopup();

  dragging = true;
}

function mouseUp(event) {
  if (icon.contains(event.target) || popup.contains(event.target)) return;

  if (selectionReady) {
    popupBehavior === 'icon' ? showIcon(event) : showPopup();

    selectionReady = false;
  }

  dragging = false;
}

// TODO: Hide icon if selection changes and mouse is not held (highlight and delete, for example. Or random site bs)
function selectionChange() {
  let tempSelection = window.getSelection();
  let text = tempSelection.toString();

  if (text.length > 0 && !SELECTION_CHECK.test(text)) {
    if (phraseSelect === 'drag') {
      // Selection check passed: store selection
      selection = tempSelection;

      if (dragging) {
        // Mouse is held down. Pass showing icon/popup to mouseup event
        selectionReady = true;
      } 
    } else if (keyPressed) {
      // Selection check passed and dragging key pressed: store selection
      selection = tempSelection;

      if (dragging) {
        selectionReady = true;
      }
    } else {
      // Dragging key is not pressed: do not store selection
      selection = null;
      selectionReady = false;
    }
    // settimeout
  } else {
    // Selection check failed: don't store selection
    selection = null;
    selectionReady = false;
  }
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
  container.className = 'papagoExt-button';

  let image = document.createElement('div');
  image.style = `background-image: url(${browser.runtime.getURL('icons/19.png')}); height: 19px; width: 19px;`;

  container.appendChild(image);
  document.body.appendChild(container);

  container.addEventListener('mousedown', e => {
    e.preventDefault();
    e.stopPropagation();
  });
  container.addEventListener('click', showPopup);

  return container;
}

function createPopup() {
  let container = document.createElement('div');
  container.className = 'papagoExt-popup';

  let path = browser.runtime.getURL('content/content.html');
  readFile(path, (res) => {
    container.innerHTML = res;
    document.body.appendChild(container);
  
    let target = document.getElementById('papagoExt-language-target');
    target.addEventListener('change', setResult);

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
}

// Add and remove from DOM instead of changing display? 
function hideIcon() {
  icon.style.display = 'none';
}

function showPopup() {
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

  // Check if popup will be off screen.
  if (left > (window.innerWidth - 350 + getPageXOffset())) {
    left = window.innerWidth - 25 - 350 + getPageXOffset();
  } else if (left < (10 + getPageXOffset())) {
    left = 10 + getPageXOffset();
  }

  popup.style.top = top + "px";
  popup.style.left = left + "px";
  popup.style.display = 'block';
}

function hidePopup() {
  popup.style.display = 'none';

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

  loading(true);

  sendTranslate(target.value, selection.toString())
  .then(res => {
    let result = document.getElementById('papagoExt-result-text');
    result.value = res.message.result.translatedText;

    if (res.message.result.tarLangType !== target.value) {
      target.value = res.message.result.tarLangType;
    }

    loading(false);
  });
}

function copyText() {
  let result = document.getElementById('papagoExt-result-text');
  navigator.clipboard.writeText(result.value);
  copied(this);
}

function copied(copyButton) {
  let div = document.createElement('div');
  div.textContent = browser.i18n.getMessage('copied');
  div.style = 'transform: translateX(15px); animation: fade 2s ease-in;';

  copyButton.parentElement.insertBefore(div, copyButton);
  setTimeout(() => div.remove(), 1900);
}

// Runtime message to background script
async function sendTranslate(targetLang, text) {
  return browser.runtime.sendMessage({
    action: 'detect',
    detectBody: {
      'query': text
    },
    body: {
      'source': "",
      'target': targetLang,
      'text': text,
      'honorific': true
    }
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