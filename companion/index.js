// Import Fitbit SDK libraries
import {settingsStorage} from "settings"
import {outbox} from "file-transfer";
import cbor from "cbor";
import * as messaging from "messaging";

// Import external 3rd party library
import "fitbit-google-analytics/companion"

// Import internal librrary
import {twitterApi} from "./twitter_api";

const FILE_NAME = "tweets.cbor";

// Reset oauth_request_token and callbackUrl
settingsStorage.setItem('oauth_request_token', '');
settingsStorage.setItem('callbackUrl', '');

/////////////////////////////////////////////////
// START OF EVENT TRIGGER CALLBACK IMPLEMENTATION
/////////////////////////////////////////////////
settingsStorage.onchange = function (evt) {
    // Call the request token API when a new callbackUrl event arrives
    if (evt.key === 'callbackUrl') {
        const newCallbackUrl = evt.newValue;
        if (newCallbackUrl.length === 0) {
            return;
        }
        twitterApi.getRequestToken(newCallbackUrl, function (token) {
            if (token) {
                console.log("found request token " + token);
                settingsStorage.setItem("oauth_request_token", token);
            }
        });

    // Call the access token API when a new oauth verifier event arrives
    } else if (evt.key === 'oauth_verifier') {
        const verifier = evt.newValue;
        if (verifier.length === 0) {
            return;
        }
        const token = settingsStorage.getItem('oauth_request_token');
        // Call access token API
        twitterApi.getAccessToken(token, verifier, function (token, secret) {
            if (token) {
                console.log("found access token " + token);
                settingsStorage.setItem("oauth_access_token", token);
            }
            if (secret) {
                console.log("found access token secret " + secret);
                settingsStorage.setItem("oauth_access_token_secret", secret);
            }
            loadTweets();
        });

        // Reset the oauth_request_token;
        settingsStorage.setItem('oauth_request_token', '');
    } else if (evt.key === 'oauth_access_token') {
        loadTweets();
    }
};

// Listen for the onmessage event
messaging.peerSocket.onmessage = function (evt) {
    // Output the message to the console
    const message = evt.data;

    // The app is ready
    if (message.what === 'appReady') {
        loadTweets();
    }
};

/////////////////////////////////////////////////
// END OF EVENT TRIGGER CALLBACK IMPLEMENTATION
/////////////////////////////////////////////////

/**
 * Load the Tweets from server
 */
function loadTweets() {
    // Tell app to display the spinner
    send({
        what: 'spinner',
        data: true
    })

    // Get user login status
    let isUserLoggedIn = false;
    if (settingsStorage.getItem('oauth_access_token')) {
        isUserLoggedIn = true;
    }

    console.log('Login status ' + isUserLoggedIn);

    // Tell app the login status
    send({
        what: 'loginStatus',
        data: isUserLoggedIn
    });

    // If user has already logged in, retrieve the current home timeline
    if (isUserLoggedIn) {
        twitterApi.getHomeTimeline(processHomeTimelineResult);
    } else {
        // Tell app to hide the spinner
        send({
            what: 'spinner',
            data: false
        })
    }
}

/**
 * Process the home timeline result array retrieve from twitter server, 
 * extract only the necessary data such as text, creation datetime and author.
 * Eventually the simplified tweet array will be transferred to the app as a binary cbor file
 *
 * @param {string} jsonText
 */
function processHomeTimelineResult(jsonText) {
    const fullTweets = JSON.parse(jsonText);
    if (fullTweets) {
        console.log(`${fullTweets.length} tweets received`);
        const simpleTweets = fullTweets.map((tweet, index) => {
            // Some unicode characters are not displayable in Fitbit devices, so we need to santize the text here
            const sanitizedText = tweet.text.split('').map(function (value, index) {
                if (value.charCodeAt(0) >= 55300) {
                    return ' ';
                }
                return value;
            }).join('');

            // Convert the date string to time long value
            const createdTime = new Date((tweet.created_at || "").replace(/-/g,"/")
                                .replace(/[TZ]/g," ")).getTime();

            // Return only the necessary data to app
            return {
                text: sanitizedText,
                createdTime: createdTime,
                author: tweet.user.screen_name
            }
        });
        // Transfer the tweets to the app
        outbox.enqueue(FILE_NAME, cbor.encode(simpleTweets));
    }
}

/**
 * A convenient method to send data to app if the peer socket is opened
 * 
 * @param {*} data the data to be sent to app
 */
function send(data) {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        // Send the data to app
        messaging.peerSocket.send(data)
    }
}
    