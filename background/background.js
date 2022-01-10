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
})

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
    return call("https://papago-extension.herokuapp.com/api/v1/translate", request.body)
}