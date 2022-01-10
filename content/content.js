// Import content.html as iframe
// Add event listeners to control bringing up content.html from icon click
const SELECTION_CHECK = /^[0-9\s\$\^\&\]\[\/\\!@#<>%*)('"{};:?|+=.,_-]+$/;

var dragStart = false;
var isDragging = false;
var selectedText = '';
var button, popup;

document.addEventListener('DOMContentLoaded', () => {
  button = createButton();
  popup = createPopup();
  
  window.addEventListener('mousedown', mouseDown);
  window.addEventListener('mousemove', mouseMove);
  window.addEventListener('mouseup', mouseUp);
})

// TODO Revamp how dragging is handled. isDragging, dragStart, etc
function mouseDown(event) {
  if (button.contains(event.target) || popup.contains(event.target)) return;

  hideButton();
  hidePopup();

  dragStart = dragOptionCheck(event);
  isDragging = false;
}

function mouseMove(event) {
  if (button.contains(event.target) || popup.contains(event.target)) return;

  isDragging = dragStart;
}

function mouseUp(event) {
  if (button.contains(event.target) || popup.contains(event.target)) return;

  // TODO Check options to see if ctrl etc should be checked for while selecting text
  if (isDragging && dragOptionCheck(event)) {
    let selection = window.getSelection().toString();

    if (selection.length > 0 && !SELECTION_CHECK.test(selection)) {
      // TODO (check options for instant translation or not) ? showButton() : showPopup()
      // settimeout
      selectedText = selection;
      showButton(event);
    }
  }
  dragStart = false;
  isDragging = false;
}

function dragOptionCheck(event) {
  // TODO Check for dragging options (holding ctrl, etc)
  return true;
}

function createButton() {
  let container = document.createElement('div');
  container.className = 'papagoExt-button';

  let icon = document.createElement('img');
  icon.src = browser.runtime.getURL('icons/19.png');

  container.appendChild(icon);
  document.body.appendChild(container);

  container.addEventListener('click', showPopup);

  return container;
}

// TODO You can't access the DOM of an iframe from an outside origin. Need a different way of bringing in html (papago for chrome style, maybe)
function createPopup() {
  let container = document.createElement('div');
  container.className = 'papagoExt-popup';

  let path = browser.runtime.getURL('content/content.html');
  readFile(path, (res) => {
    container.innerHTML = res;
  });

  container.addEventListener('DOMContentLoaded', () => {
    let target = document.getElementById('papagoExt-language-target');
    target.addEventListener('change', setResult);

    let copyButton = document.getElementById('papagoExt-copy-button');
    copyButton.addEventListener('click', copyText);
  })
  
  document.body.appendChild(container);

  return container;
}

function showButton(event) {
  button.style.top = (event.pageY + 10) + "px";
  button.style.left = (event.pageX + 10) + "px";
  button.style.display = 'block';
}

function hideButton() {
  button.style.display = 'none';
}

function showPopup(event) {
  hideButton();

  setResult(event);

  popup.style.top = (event.pageY + 10) + "px";
  popup.style.left = (event.pageX + 10) + "px";
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

function setResult(event) {
  let target = document.getElementById('papagoExt-language-target');

  loading(true);

  sendTranslate(target.value, selectedText)
  .then(res => {
    let result = document.getElementById('papagoExt-result-text');
    result.value = res.message.result.translatedText;

    if (res.message.result.tarLangType !== target.value) {
      target.value = res.message.result.tarLangType;
    }

    loading(false);
  });
}

function copyText(event) {
  let result = document.getElementById('papagoExt-result-text');
  navigator.clipboard.writeText(result.value);
  copied(this);
}

function copied(button) {
  let div = document.createElement('div');
  div.textContent = "- Copied!";
  div.style = 'position: absolute; left: 50%; transform: translateX(50%); animation: fade 2s ease-in;';

  button.parentElement.insertBefore(div, button);
  setTimeout(() => div.remove(), 1900);
}

// Runtime messages to background script
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