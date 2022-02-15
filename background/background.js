browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	console.log("message came in: ", request);
	browser.storage.local.get(['cache'], items => {
		console.log("hello");
		// Check the cache first
		if (items.cache) {
			console.log(items.cache);
			// Search cache
			let cached = items.cache.find(obj => obj.request == request);
			if (cached) {
				// Request is cached
				sendResponse(cached.response);
				return true;
			}
		}

		// Request not in cache
		switch (request.action) {
			case 'detect':
				detect(request)
					.then(body => {
						sendResponse(body);
						storeCache(items.cache || [], request, body);
					})
					.catch(err => sendResponse(err));
				return true;
			case 'translate':
				console.log("starting translate");
				translate(request)
					.then(body => {
						sendResponse(body);
						console.log(body);
						storeCache(items.cache || [], request, body);
					})
					.catch(err => sendResponse(err));
				return true;
		}
	});
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
		request.body.target = response.langCode == 'en' ? 'ko' : 'en';
	}

	return translate(request)
}

function translate(request) {
	console.log("hello from translate()");
	return call("https://papago-extension.herokuapp.com/api/v1/translate", request.body)
}

function storeCache(cache, request, response) {
	// Make sure cache doesn't exceed 5 requests
	if (cache.length > 4) cache.shift();

	// Add request to cache
	browser.storage.local.set({
		cache: cache.push({
			request: request,
			response: response
		})
	});

	console.log(cache);
}