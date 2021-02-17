import { utils } from "./utils";
import { twitterOAuth } from "./twitter_oauth";

const requestTokenUrl = "https://api.twitter.com/oauth/request_token";
const accessTokenUrl = "https://api.twitter.com/oauth/access_token";
const homeTimelineUrl =
  "https://api.twitter.com/1.1/statuses/home_timeline.json";
const likeTweetUrl = "https://api.twitter.com/1.1/favorites/create.json";
const retweetUrl = "https://api.twitter.com/1.1/statuses/retweet/:id.json";

function getRequestToken(newCallbackUrl, callback) {
  // Use this proxy to bypass the cross-origin restriction in the settings page
  fetch("https://dawn-sky-10e1.qichuan.workers.dev/?" + requestTokenUrl, {
    method: "POST",
    headers: {
      Authorization: twitterOAuth.getAuthorizationForRequestToken(
        "POST",
        requestTokenUrl,
        newCallbackUrl
      ),
    },
  })
    .then((res) => res.text())
    .then((text) => processRequestTokenResultQueryText(text, callback))
    .catch((error) => console.log("Error: " + error.toLocaleString()));
}

function getAccessToken(token, verifier, callback) {
  fetch(accessTokenUrl, {
    method: "POST",
    headers: {
      Authorization: twitterOAuth.getAuthorizationForAccessToken(
        "POST",
        accessTokenUrl,
        token,
        verifier
      ),
    },
  })
    .then((res) => res.text())
    .then((text) => processAccessTokenResultQueryText(text, callback))
    .catch((error) => console.log("Error: " + error.toLocaleString()));
}

function getHomeTimeline(accessToken, accessTokenSecret, callback) {
  const additionalParams = { tweet_mode: "extended", count: 20 };
  fetch(homeTimelineUrl + `?count=${20}&tweet_mode=extended`, {
    method: "GET",
    headers: {
      Authorization: twitterOAuth.getAuthorizationForProtectedResource(
        "GET",
        homeTimelineUrl,
        accessToken,
        accessTokenSecret,
        additionalParams
      ),
    },
  })
    .then((res) => res.text())
    .then((text) => callback(text))
    .catch((error) => console.log("Error: " + error.toLocaleString()));
}

function likeTweet(tweetIdToLike, accessToken, accessTokenSecret, callback) {
  const url = likeTweetUrl + "?id=" + tweetIdToLike;
  fetch(url, {
    method: "POST",
    headers: {
      Authorization: twitterOAuth.getAuthorizationForProtectedResource(
        "POST",
        likeTweetUrl,
        accessToken,
        accessTokenSecret,
        { id: tweetIdToLike }
      ),
    },
  })
    .then((res) => res.text())
    .then((text) => callback(text))
    .catch((error) => console.log("Error: " + error.toLocaleString()));
}

function retweet(tweetIdToRetweet, accessToken, accessTokenSecret, callback) {
  const url = retweetUrl.replace(":id", tweetIdToRetweet);
  console.log(url);
  fetch(url, {
    method: "POST",
    headers: {
      Authorization: twitterOAuth.getAuthorizationForProtectedResource(
        "POST",
        url,
        accessToken,
        accessTokenSecret
      ),
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.text())
    .then((text) => callback(text))
    .catch((error) => console.log("Error: " + error.toLocaleString()));
}

function processRequestTokenResultQueryText(queryText, callback) {
  if (queryText) {
    const result = utils.queryStringToObject(queryText);
    const token = result["oauth_token"];
    if (callback) {
      callback(token);
    }
  }
}

function processAccessTokenResultQueryText(queryText, callback) {
  if (queryText) {
    const result = utils.queryStringToObject(queryText);
    const token = result["oauth_token"];
    const secret = result["oauth_token_secret"];
    if (callback) {
      callback(token, secret);
    }
  }
}

const twitterApi = {
  getRequestToken,
  getAccessToken,
  getHomeTimeline,
  likeTweet,
  retweet,
};

export { twitterApi };
