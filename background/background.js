const LANGS = ['en', 'ko', 'ja', 'zh', 'vi', 'id', 'th', 'de', 'ru', 'es', 'it', 'fr'];

detectPreferredLanguage();

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
	let browserLang = window.navigator.language.substring(0, 2);

	if (!LANGS.includes(browserLang)) {
		browserLang = null;
	}
	
	browser.storage.local.set({
		browserLang: browserLang
	});
}
