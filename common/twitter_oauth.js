
//import {settingsStorage} from "settings";
import {jsSHA} from "../companion/sha1";
import {consumerKey, consumerSecret} from "../companion/common";
import {Base64} from "../companion/base64";

/**
 * For Request Token
 */

// Twitter authorization See https://imagineer.in/blog/authorizing-twitter-api-calls-in-javascript/
function getAuthorizationForRequestToken(httpMethod, baseUrl, fitbitAppCallback) {

    // timestamp as unix epoch
    let timestamp = Math.round(Date.now() / 1000);
    // nonce as base64 encoded unique random string
    let nonce = Base64.btoa(consumerKey + ':' + timestamp);
    let callback = encodeURIComponent(`https://app-settings.fitbitdevelopercontent.com/simple-redirect.html?state=${encodeURIComponent(fitbitAppCallback)}`);
    // generate signature from base string & signing key
    let baseString = oAuthBaseStringForRequestToken(httpMethod, baseUrl, consumerKey, timestamp, nonce, callback);
    let signingKey = oAuthSigningKey(consumerSecret);
    let signature = oAuthSignature(baseString, signingKey);

    // return interpolated string
    return 'OAuth ' +
        'oauth_consumer_key="' + consumerKey + '", ' +
        'oauth_nonce="' + nonce + '", ' +
        'oauth_signature="' + signature + '", ' +
        'oauth_signature_method="HMAC-SHA1", ' +
        'oauth_timestamp="' + timestamp + '", ' +
        'oauth_callback="' + callback + '", ' +
        'oauth_version="1.0"';
}

function oAuthBaseStringForRequestToken(method, url, key, timestamp, nonce, callback) {
    return method
        + '&' + percentEncode(url)
        + '&' + percentEncode(genSortedParamStrForRequestToken(key, timestamp, nonce, callback));
}

// Generate Sorted Parameter String for base string params
function genSortedParamStrForRequestToken(key, timestamp, nonce, callback) {
    let paramObj = {
        oauth_callback: callback,
        oauth_consumer_key: key,
        oauth_nonce: nonce,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: timestamp,
        oauth_version: '1.0'
    };
    return encodeObjectToParamStr(paramObj)
}

/**
 * For Access Token
 */

function getAuthorizationForAccessToken(httpMethod, baseUrl, requestToken, verifier) {

    let timestamp = Math.round(Date.now() / 1000);
    // nonce as base64 encoded unique random string
    let nonce = Base64.btoa(consumerKey + ':' + timestamp);
    // generate signature from base string & signing key
    let baseString = oAuthBaseStringForAccessToken(httpMethod, baseUrl, consumerKey, timestamp.nonce, requestToken, verifier);
    let signingKey = oAuthSigningKey(consumerSecret);
    let signature = oAuthSignature(baseString, signingKey);

    // return interpolated string
    return 'OAuth ' +
        'oauth_consumer_key="' + consumerKey + '", ' +
        'oauth_nonce="' + nonce + '", ' +
        'oauth_signature="' + signature + '", ' +
        'oauth_signature_method="HMAC-SHA1", ' +
        'oauth_timestamp="' + timestamp + '", ' +
        'oauth_token="' + requestToken + '", ' +
        'oauth_verifier="' + verifier + '", ' +
        'oauth_version="1.0"';
}

function oAuthBaseStringForAccessToken(method, url, key, timestamp, nonce, requestToken, verifier) {
    return method
        + '&' + percentEncode(url)
        + '&' + percentEncode(genSortedParamStrForAccessToken(key, timestamp, nonce, requestToken, verifier));
}

function genSortedParamStrForAccessToken(key, timestamp, nonce, token, verifier) {
    let paramObj = {
        oauth_consumer_key: key,
        oauth_nonce: nonce,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: timestamp,
        oauth_token: token,
        oauth_verifier: verifier,
        oauth_version: '1.0'

    };
    return encodeObjectToParamStr(paramObj)
}


/**
 * For Home Timeline
 */

function getAuthorizationForProtectedResource(httpMethod, baseUrl, accessToken, accessTokenSecret, additionalParams) {
    // timestamp as unix epoch
    let timestamp = Math.round(Date.now() / 1000);
    // nonce as base64 encoded unique random string
    let nonce = Base64.btoa(consumerKey + ':' + timestamp);

    // generate signature from base string & signing key
    let baseString = oAuthBaseStringForProtectedResource(httpMethod, baseUrl, consumerKey, timestamp, nonce, accessToken, additionalParams);
    let signingKey = oAuthSigningKeyWithAccessTokenScrect(consumerSecret, accessTokenSecret);
    let signature = oAuthSignature(baseString, signingKey);

    // return interpolated string
    return 'OAuth ' +
        'oauth_consumer_key="' + consumerKey + '", ' +
        'oauth_nonce="' + nonce + '", ' +
        'oauth_signature="' + signature + '", ' +
        'oauth_signature_method="HMAC-SHA1", ' +
        'oauth_timestamp="' + timestamp + '", ' +
        'oauth_token="' + accessToken + '", ' +
        'oauth_version="1.0"';
}

function oAuthBaseStringForProtectedResource(method, url, key, timestamp, nonce, accessToken, additionalParams) {
    return method
        + '&' + percentEncode(url)
        + '&' + percentEncode(genSortedParamStrForProtectedResource(key, timestamp, nonce, accessToken, additionalParams));
}

function genSortedParamStrForProtectedResource(key, timestamp, nonce, accessToken, additionalParams) {
    let paramObj = {
        oauth_consumer_key: key,
        oauth_nonce: nonce,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: timestamp,
        oauth_token: accessToken,
        oauth_version: '1.0'
    };

    if (additionalParams) {
        paramObj = {...paramObj, ...additionalParams};
    }
    return encodeObjectToParamStr(paramObj)
}

/*
 * Common Functions
 */

function oAuthSigningKey(consumer_secret) {
    return percentEncode(consumer_secret) + '&';
}

function oAuthSigningKeyWithAccessTokenScrect(consumer_secret, access_token_secret) {
    return percentEncode(consumer_secret) + '&' + percentEncode(access_token_secret);
}

function oAuthSignature(base_string, signing_key) {
    const signature = hmac_sha1(base_string, signing_key);
    return percentEncode(signature);
}

// Percent encoding
function percentEncode(str) {
    return encodeURIComponent(str).replace(/[!*()']/g, (character) => {
        return '%' + character.charCodeAt(0).toString(16);
    });
}

function hmac_sha1(string, secret) {
    let shaObj = new jsSHA("SHA-1", "TEXT");
    shaObj.setHMACKey(secret, "TEXT");
    shaObj.update(string);
    return shaObj.getHMAC("B64");
}

function encodeObjectToParamStr(paramObj) {
    // Sort alphabetically
    let paramObjKeys = Object.keys(paramObj);
    let len = paramObjKeys.length;
    paramObjKeys.sort();
    // Interpolate to string with format as key1=val1&key2=val2&...
    let paramStr = paramObjKeys[0] + '=' + paramObj[paramObjKeys[0]];
    for (var i = 1; i < len; i++) {
        paramStr += '&' + paramObjKeys[i] + '=' + percentEncode(decodeURIComponent(paramObj[paramObjKeys[i]]));
    }
    return paramStr;
}

const twitterOAuth = {
    getAuthorizationForRequestToken, getAuthorizationForAccessToken, getAuthorizationForProtectedResource
}

export {twitterOAuth}