// Constants
const SELECTION_CHECK = /^[0-9\s\$\^\&\]\[\/\\!@#<>%*)('"{};:?|+=.,_-]+$/;
const FONTS = ['Tahoma', 'Geneva', 'Sans-Serif'];

// Options variables
var defLang, useInline, phraseSelect, inlineBehavior;

// Global variables
var dragging = false;
var keyPressed = false;

var draggableDown = false;
var offset;

var selection, selectedText, selectedLang;

var icon, inline;


window.addEventListener('DOMContentLoaded', () => {
  // Checking if script has already been injected
  if (document.getElementsByClassName('papagoExt-icon').length > 0 
    && document.getElementsByClassName('papagoExt-inline').length > 0) return;

  // Set default settings if none have been changed by the user yet.
  browser.storage.local.get({
    defTargetLang: null,
    defFont: 'Tahoma',
    defTheme: 'auto',
    useInline: true,
    phraseSelect: 'drag',
    inlineBehavior: 'icon',
    browserLang: 'en'
  })
  .then(config => {
    let defFont = config.defFont == 'default' ? 'Tahoma' : config.defFont;

    useInline = config.useInline;
    phraseSelect = config.phraseSelect;
    inlineBehavior = config.inlineBehavior;

    // If inline is disabled, then nothing will happen to the page
    if (useInline) {
      defLang = config.defTargetLang || config.browserLang;

      icon = createIcon();
      inline = createInline();

      document.addEventListener('mousedown', mouseDown);
      document.addEventListener('mouseup', mouseUp);
      document.addEventListener('mousemove', mouseMove);
      
      document.addEventListener('selectionchange', selectionChange);

      if (phraseSelect != 'drag') {
        document.addEventListener('keydown', keyDown);
        document.addEventListener('keyup', keyUp);
      }

      // Set font
      inline.style.fontFamily = defFont + ', ' + FONTS.join(', ');

      // Set theme 
      if (config.defTheme == 'auto') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
          // Light mode
          inline.classList.add('light');
        } else {
          // Dark mode
          inline.classList.add('dark');
        }
      } else if (config.defTheme == 'light') {
        inline.classList.add('light');
      } else {
        inline.classList.add('dark');
      }
    }
  })
  .catch(err => {console.log(err)});
});

function mouseDown(event) {
  if (icon.contains(event.target) || inline.contains(event.target)) return;

  selection = selectedText = selectedLang = null;
  hideIcon();
  hideInline();

  dragging = true;
}

function mouseUp(event) {
  draggableDown = false;
  if (icon.contains(event.target) || inline.contains(event.target)) return;

  // If the mouseup event's intention is to deselect, this timeout allows the browser to do so
  // before continuing.
  setTimeout(() => {
    let tempSelection = window.getSelection();
    let tempText = tempSelection.toString();

    if (tempText.length > 0 && !SELECTION_CHECK.test(tempText)) {
      if (phraseSelect === 'drag' || keyPressed) {
        if (dragging) {
          // Selection check passed: store selection
          selection = window.getSelection();
          selectedText = selection.toString();

          // Mouse is held down. Pass showing icon/inline to mouseup event
          inlineBehavior === 'icon' ? showIcon(event) : showInline();
        } 
      }
    }

    dragging = false;
  }, 10);
}

function mouseMove(event) {
  if (draggableDown) {
    inline.style.left = (event.clientX + offset.left) + 'px';
    inline.style.top = (event.clientY + offset.top) + 'px';
  }
}

function keyDown(event) {
  if (phraseSelect === 'alt-drag' && event.keyCode === 18) {
    keyPressed = true;
  } else if (phraseSelect === 'ctrl-drag' && event.keyCode === 17) {
    keyPressed = true;
  }
}

function keyUp(event) {
  if (phraseSelect === 'alt-drag' && event.keyCode === 18) {
    keyPressed = false;
  } else if (phraseSelect === 'ctrl-drag' && event.keyCode === 17) {
    keyPressed = false;
  }
}

function selectionChange() {
  if (window.getSelection().toString().length == 0) {
    if (icon.style.display != 'none') hideIcon();
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

  container.innerHTML = contentHTML;
  document.body.appendChild(container);

  let target = document.getElementById('papagoExt-language-target');
  target.addEventListener('change', setResult);
  target.value = defLang;

  let copyButton = document.getElementById('papagoExt-copy-button');
  copyButton.addEventListener('click', copyText);

  let draggables = document.getElementsByClassName('papago-draggable')
  for (let i = 0; i  < draggables.length; i++) {
    draggables[i].addEventListener('mousedown', (event) => {
      if (event.target != draggables[i]) return;

      event.preventDefault();

      draggableDown = true;
      offset = {
        left: container.offsetLeft - event.clientX,
        top: container.offsetTop - event.clientY
      }
    })
  }

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

  // Timeout can interfere with showing the icon if showIcon is called again. 
  // Not sure how to check if icon has been hidden already.
  // setTimeout(hideIcon, 20000);
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
  result.textContent = '';
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
      if (response.error) throw new Error(response.message);
    }

    loading(true);

    sendTranslate(selectedLang, target.value, selectedText)
    .then(response => {
      if (!response.message) throw new Error(response);
  
      result.textContent = response.message.result.translatedText;
  
      loading(false);
    })
    .catch(err => {
      result.textContent = err.message;
      loading(false);
    });
  } else {
    // Source language needs to be detected
    loading(true);

    sendDetect(target.value, selectedText)
    .then(response => {
      if (response.error) throw new Error(response.message);

      result.textContent = response.message.result.translatedText;
      selectedLang = response.message.result.srcLangType;

      if (response.message.result.tarLangType !== target.value) {
        target.value = response.message.result.tarLangType;
      }

      loading(false);
    })
    .catch(err => {
      result.textContent = err.message;
      loading(false);
    });
  }
}

function copyText() {
  let result = document.getElementById('papagoExt-result-text');
  navigator.clipboard.writeText(result.textContent);
  copied(this);
}

function copied(copyButton) {  
  let div = document.createElement('div');
  div.textContent = browser.i18n.getMessage('copied');
  div.style = 'position: absolute; overflow: hidden; animation: fade 2s ease-in;';
  div.style.right = copyButton.offsetWidth + 15 + 'px';
  div.style.top = copyButton.offsetTop + 5 + 'px';

  console.log(copyButton);

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

function getPageXOffset() {
  return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
}

function getPageYOffset() {
  return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
}

const contentHTML = `
  <div class="papagoExt-flex-column" id="papagoExt-blur">
    <div class="papagoExt-flex papago-draggable">
      <select name="papagoExt-target" class="papagoExt-bordered" id="papagoExt-language-target">
        <option id="en" value="en">English</option>
        <option id="ko" value="ko">Korean</option>
        <option id="ja" value="ja">Japanese</option>
        <option id="zh-CN" value="zh-CN">Chinese (Simplified)</option>
        <option id="zh-TW" value="zh-TW">Chinese (Traditional)</option>
        <option id="vi" value="vi">Vietnamese</option>
        <option id="id" value="id">Indonesian</option>
        <option id="th" value="th">Thai</option>
        <option id="de" value="de">German</option>
        <option id="ru" value="ru">Russian</option>
        <option id="es" value="es">Spanish</option>
        <option id="it" value="it">Italian</option>
        <option id="fr" value="fr">French</option>
      </select>
      <div class="papagoExt-bordered" id="papagoExt-copy-button">Copy</div>
    </div>
    <div class="papagoExt-bordered" id="papagoExt-result-text"></div>
  </div>
  <div id="papagoExt-loader">
    <div id="papagoExt-loading-animation"></div>
  </div>
`;
