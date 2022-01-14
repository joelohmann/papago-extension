// Import content.html as iframe
// Add event listeners to control bringing up content.html from icon click
// TODO Add locale support for popup
const SELECTION_CHECK = /^[0-9\s\$\^\&\]\[\/\\!@#<>%*)('"{};:?|+=.,_-]+$/;

// Options variables
var usePopup, phraseSelect, popupBehavior;

// Global variables
var dragging = false;
var selectionReady = false;
var keyPressed = false;
var selection;

var icon, popup;

document.addEventListener('DOMContentLoaded', () => {
  browser.storage.local.get(['usePopup', 'phraseSelect', 'popupBehavior'], config => {
    usePopup = config.usePopup ? config.usePopup : true;
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
    popupBehavior === 'icon' ? showIcon() : showPopup();

    selectionReady = false;
  }

  dragging = false;
}

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

// TODO Stress test this
function keyDown(event) {
  if (phraseSelect !== 'drag') {
    if (phraseSelect === 'alt-drag' && event.altKey) {
      keyPressed = true;
    } else if (phraseSelect === 'ctrl-drag' && event.ctrlKey) {
      keyPressed = true;
    } else {
      keyPressed = false;
    }
  }
}

function keyUp(event) {
  if (phraseSelect === 'alt-drag' && event.altKey) {
    keyPressed = false;
  } else if (phraseSelect === 'ctrl-drag' && event.ctrlKey) {
    keyPressed = false;
  }
}

function createIcon() {
  let container = document.createElement('div');
  container.className = 'papagoExt-button';

  let image = document.createElement('div');
  image.style.background = `url(${browser.runtime.getURL('icons/19.png')}) no-repeat`;

  container.appendChild(image);
  document.body.appendChild(container);

  container.addEventListener('click', showPopup);

  return container;
}

function createPopup() {
  let container = document.createElement('div');
  container.className = 'papagoExt-popup';

  let path = browser.runtime.getURL('content/content.html');
  readFile(path, (res) => {
    container.innerHTML = res;
  
    let target = document.getElementById('papagoExt-language-target');
    target.addEventListener('change', setResult);

    let copyButton = document.getElementById('papagoExt-copy-button');
    copyButton.addEventListener('click', copyText);
  });
  
  document.body.appendChild(container);

  return container;
}

function showIcon() {
  let rect = selection.getRangeAt(0).getBoundingClientRect();

  icon.style.top = (rect.bottom + getPageYOffset() + 5) + "px";
  icon.style.left = (rect.right + getPageXOffset() + 5) + "px";
  icon.style.display = 'block';
}

function hideIcon() {
  icon.style.display = 'none';
}

function showPopup() {
  hideIcon();

  setResult();

  // TODO Try last in index (selection.rangeCount)
  let rect = selection.getRangeAt(0).getBoundingClientRect();

  popup.style.top = (rect.bottom + getPageYOffset() + 5) + "px";
  popup.style.left = (rect.right + getPageXOffset() + 5) + "px";
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
  div.textContent = "Copied!";
  div.style = 'position: absolute; left: 50%; transform: translateX(65%); animation: fade 2s ease-in;';

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