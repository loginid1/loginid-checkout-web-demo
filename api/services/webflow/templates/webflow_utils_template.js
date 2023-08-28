async function checkToken(apiUrl, publicKey) {
    const token = localStorage.getItem("loginid-token");

    if (token == null) {
        console.log("nt");
        return Promise.resolve(false);
    }

    let signature = localStorage.getItem("loginid-token-signature");
    if (signature == null) {
        let tokenResponse = await getTokenSignature(apiUrl, token);
        signature = tokenResponse.signature;
        localStorage.setItem("loginid-token-signature", signature);
    }

    if (signature == null) {
        console.log("ns");
        return Promise.resolve(false);
    }

    let importKey = await window.crypto.subtle.importKey(
        "jwk",
        publicKey,
        {
            name: "ECDSA",
            namedCurve: "P-256",
        },
        true,
        ["verify"]
    );

    let encoder = new TextEncoder();

    let result = await window.crypto.subtle.verify(
        {
            name: "ECDSA",
            hash: { name: "SHA-256" },
        },
        importKey,
        base64ToBuffer(signature),
        encoder.encode(token)
    );
    console.log("re: " + result);
    return Promise.resolve(result);
}

async function checkAuthorizePage(apiUrl, publicKey, protectedPages, loginPage) {
    const path = document.location.pathname;
    console.log("ca: " + path);
    if (matchProtectedPage(protectedPages, path)) {
        const validToken = await checkToken(apiUrl, publicKey);
        if (!validToken) {
            console.log("invalid");
            location.href=loginPage;
        }
    }
}

async function getTokenSignature(apiUrl, token) {
    try {
        const response = await fetch(
            apiUrl + "/webflow/validateToken",
            {
                method: "POST",
                body: JSON.stringify({
                    token: token,
                    vendor: "webflow",
                }),
                redirect: "follow",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        if (response.ok) {
            let json = await response.json();
            return Promise.resolve(json);
        } else {
            Promise.reject("error ");
        }
    } catch (error) {
        console.log("error: " + error);
        Promise.reject("error ");
    }
}

function matchProtectedPage(pages, path){
    for(let page of pages) {
        if(path.includes(page)){
            return true;
        }
    }
    return false;
}

function base64ToBuffer(base64) {
    var binaryString = atob(base64);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}
