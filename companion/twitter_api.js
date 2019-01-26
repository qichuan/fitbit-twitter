import {utils} from "../common/utils";
import {twitterOAuth} from "./twitter_oauth";

const requestTokenUrl = "https://api.twitter.com/oauth/request_token";
const accessTokenUrl = "https://api.twitter.com/oauth/access_token";
const homeTimelineUrl = "https://api.twitter.com/1.1/statuses/home_timeline.json";

function getRequestToken(newCallbackUrl, callback) {
    fetch(requestTokenUrl, {
        method: "POST",
        headers: {
            Authorization: twitterOAuth
                .getAuthorizationForRequestToken('POST',
                    requestTokenUrl, newCallbackUrl)
        }
    }).then(res => res.text())
        .then(text => processRequestTokenResultQueryText(text, callback))
        .catch(error => console.log('Error: ' + error.toLocaleString()));
}

function getAccessToken(token, verifier, callback) {
    fetch(accessTokenUrl, {
        method: "POST",
        headers: {
            Authorization: twitterOAuth
                .getAuthorizationForAccessToken('POST',
                    accessTokenUrl, token, verifier),
        }
    }).then(res => res.text())
        .then(text => processAccessTokenResultQueryText(text, callback))
        .catch(error => console.log('Error: ' + error.toLocaleString()));
}

function getHomeTimeline(callback) {
    fetch(homeTimelineUrl, {
        method: "GET",
        headers: {
            Authorization: twitterOAuth
                .getAuthorizationForProtectedResource('GET', homeTimelineUrl)
        }
    }).then(res => res.text())
        .then(text => callback(text))
        .catch(error => console.log('Error: ' + error.toLocaleString()));
}


function processRequestTokenResultQueryText(queryText, callback) {
    if (queryText) {
        const result = utils.queryStringToObject(queryText);
        const token = result['oauth_token'];
        if (callback) {
            callback(token);
        }
    }
}

function processAccessTokenResultQueryText(queryText, callback) {
    if (queryText) {
        const result = utils.queryStringToObject(queryText);
        const token = result['oauth_token'];
        const secret = result['oauth_token_secret'];
        if (callback) {
            callback(token, secret);
        }
    }
}

const twitterApi = {
    getRequestToken, getAccessToken, getHomeTimeline
};

export {twitterApi}