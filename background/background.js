browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	browser.storage.local.get(['cache'], items => {
		// Check the cache first
		if (items.cache) {
			// Search cache
			let cached = items.cache.find(obj => JSON.stringify(obj.request) == JSON.stringify(request));
			if (cached) {
				// Request is cached
				sendResponse(cached.response);
				return;
			}
		}

		// Request not in cache
		// Clone original request
		let initRequest = JSON.parse(JSON.stringify(request));

		// Handle translation request
		switch (request.action) {
			case 'detect':
				detect(request)
					.then(body => {
						sendResponse(body);
						storeCache(items.cache || [], initRequest, body);
					})
					.catch(err => sendResponse(err));
				return;
			case 'translate':
				translate(request)
					.then(body => {
						sendResponse(body);
						storeCache(items.cache || [], initRequest, body);
					})
					.catch(err => sendResponse(err));
				return;
		}
	});

	// Tells sender to wait for a response
	return true;
});

async function call(url, body) {
	let response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});
	if (response.status == 200) {
		let message = await response.json();
		return message;
	} else {
		throw response.message;
	}
}

async function detect(request) {
	let response = await call("https://papago-extension.herokuapp.com/api/v1/detect", request.detectBody);

	request.body['source'] = response.langCode;

	// If detected language is the same as the source, then change target to either English or Korean
	if (response.langCode == request.body.target) {
		request.body.target = response.langCode != 'en' ? 'en' : 'ko';
	}

	return translate(request)
}

function translate(request) {
	return call("https://papago-extension.herokuapp.com/api/v1/translate", request.body)
}

function storeCache(cache, request, response) {
	// Make sure cache doesn't exceed 5 requests
	if (cache.length > 4) cache.shift();

	// Add request to cache
	cache.push({
		request: request,
		response: response
	});

	browser.storage.local.set({
		cache: cache
	});
}