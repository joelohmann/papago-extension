const LANGS = ['en', 'ko', 'ja', 'zh', 'vi', 'id', 'th', 'de', 'ru', 'es', 'it', 'fr'];
const PAGE_LANGS = ['en', 'ko', 'ja', 'zh-CN', 'zh-TW'];

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
	let response = await fetch(url);

	if (!response.ok) {
		let error = {
			message: "Sorry, there was an error.",
			error: true
		}
		return error;
	}

	return await response.json();
}

function detect(request) {
	return call("https://papago-extension.herokuapp.com/api/v1/detect?" + request.query);
}

function translate(request) {
	return call("https://papago-extension.herokuapp.com/api/v1/translate?" + request.query)
}

function detectPreferredLanguage() {
	let browserLang = browser.i18n.getUILanguage().substring(0, 2);

	if (!LANGS.includes(browserLang)) {
		browserLang = 'en';
	}

	browser.storage.local.set({
		browserLang: browserLang
	});
}

function translatePage(tab) {
	browser.storage.local.get({
		browserLang: 'en'
	})
	.then(config => {
		let sourceLang = PAGE_LANGS.includes(config.browserLang) ? config.browserLang : 'ko';
		let targetLang = sourceLang != 'en' ? 'en' : 'ko';

		let url = `https://papago.naver.net/website?locale=${config.browserLang}&source=${sourceLang}&target=${targetLang}&url=${encodeURIComponent(tab.url)}`;
		
		browser.tabs.create({
			url: url,
			index: tab.index + 1
		})
	})	
}
