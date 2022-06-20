const LANGS = ['en', 'ko', 'ja', 'zh', 'vi', 'id', 'th', 'de', 'ru', 'es', 'it', 'fr'];
const PAGE_LANGS = ['en', 'ko', 'ja', 'zh-CN', 'zh-TW'];

var browserLang;
detectPreferredLanguage();

browser.contextMenus.create({
	id: "translatePage",
	title: browser.i18n.getMessage("translate_this_page"),
	contexts: ["all"]
});

browser.contextMenus.onClicked.addListener((info, tab) => {
	switch (info.menuItemId) {
		case "translatePage":
			translatePage(tab);
			break;
	}
});

// Handle translation requests
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {		
	switch (request.action) {
		case 'detect':
			detect(request)
				.then(body => sendResponse(body))
				.catch(err => sendResponse(err));
			return true;
		case 'translate':
			translate(request)
				.then(body => sendResponse(body))
				.catch(err => sendResponse(err));
			return true;
	}
});

async function call(url) {
	try {
		let response = await fetch(url);

		return await response.json();
	} catch (err) {
		throw err;
	}
}

function detect(request) {
	return call("https://papago-extension.herokuapp.com/api/v1/detect?" + request.query);
}

function translate(request) {
	return call("https://papago-extension.herokuapp.com/api/v1/translate?" + request.query)
}

function detectPreferredLanguage() {
	browserLang = window.navigator.language.substring(0, 2);

	if (!LANGS.includes(browserLang)) {
		browserLang = null;
	}

	browser.storage.local.set({
		browserLang: browserLang
	});
}

function translatePage(tab) {
	let sourceLang = PAGE_LANGS.includes(browserLang) ? browserLang : 'ko';
	let targetLang = sourceLang != 'en' ? 'en' : 'ko';

	let url = `https://papago.naver.net/website?locale=${browserLang}&source=${sourceLang}&target=${targetLang}&url=${encodeURIComponent(tab.url)}`;
  
	browser.tabs.create({
		url: url,
		index: tab.index + 1
	})	
  }
