// Import Fitbit SDK libraries
import {settingsStorage} from "settings"
import {outbox} from "file-transfer";
import cbor from "cbor";
import * as messaging from "messaging";
import { Image } from "image";
import { localStorage } from "local-storage";
import { me } from "companion";

// Import external 3rd party library
import "fitbit-google-analytics/companion"

// Import internal librrary
import {twitterApi} from "./twitter_api";

const FILE_NAME = "tweets.cbor";

function getRequestToken() {
    const callbackUrl = "fitbit://gallery/webconfig/3344bcba-4f57-4b62-b6de-44c49fcab89d/" + me.buildId;
    twitterApi.getRequestToken(callbackUrl, function (token) {
        if (token) {
            console.log("found request token " + token);
            settingsStorage.setItem("oauth_request_token", token);
        }
    });
}

/////////////////////////////////////////////////
// START OF EVENT TRIGGER CALLBACK IMPLEMENTATION
/////////////////////////////////////////////////
settingsStorage.onchange = function (evt) {
    // When logout button is clicked 
    if (evt.key === 'invokeLogout') {
        console.log('Logout button is clicked');
        settingsStorage.setItem("oauth_access_token", "");
        settingsStorage.setItem("oauth_access_token_secret", "");
        getRequestToken();

        localStorage.clear();

        send({
            what: 'loginStatus',
            data: false
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
        // loadTweets();
    }
};

// Listen for the onmessage event
messaging.peerSocket.onmessage = function (evt) {
    // Output the message to the console
    const message = evt.data;

    // The app is ready
    if (message.what === 'appReady') {
        console.log('The device is ready');
        // If the request token is not available, request one
        if (!isUserLoggedIn()) {   
            getRequestToken();
        }

        loadTweets();
    }
};

/////////////////////////////////////////////////
// END OF EVENT TRIGGER CALLBACK IMPLEMENTATION
/////////////////////////////////////////////////

function isUserLoggedIn() {
    return settingsStorage.getItem('oauth_access_token') != null
                                && settingsStorage.getItem('oauth_access_token').length > 0
}

/**
 * Load the Tweets from server
 */
function loadTweets() {
    // Tell app to display the spinner
    send({
        what: 'spinner',
        data: true
    });

    // Get user login status
    const loggedIn = isUserLoggedIn();

    console.log('Login status ' + loggedIn);

    // Tell app the login status
    send({
        what: 'loginStatus',
        data: loggedIn
    });

    // If user has already logged in, retrieve the current home timeline
    if (loggedIn) {
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
            let sanitizedText = tweet.text.split('').map(function (value, index) {
                if (value.charCodeAt(0) >= 55300) {
                    return ' ';
                }
                return value;
            }).join('');

            const found = sanitizedText.indexOf('https://t.co/');
            if (found > 0) {
                sanitizedText = sanitizedText.substring(0, found);
            }

            // Load the media image
            // if (tweet.entities.media) {
            //     fetchAndTranferImageFile(tweet.entities.media[0].media_url_https+':thumb', tweet.id + '.jpg');
            // }

            // Convert the date string to time long value
            const createdTime = new Date((tweet.created_at || "").replace(/-/g,"/")
                                .replace(/[TZ]/g," ")).getTime();

            // Load the avatar image
            fetchAndTransferImageFile(
                tweet.user.profile_image_url_https,
                `avatar_${tweet.user.screen_name}.jpg`);
            // Return only the necessary data to app
            return {
                id: tweet.id,
                text: sanitizedText,
                createdTime: createdTime,
                author: tweet.user.screen_name,
                fullName: tweet.user.name,
                likes: tweet.favorite_count,
            }
        });
        // Transfer the tweets to the app
        outbox.enqueue(FILE_NAME, cbor.encode(simpleTweets));
    }
}

function fetchAndTransferImageFile(imageUrl, destFilename) {
    // Do not fetch if the image has already been fetched before
    if (localStorage.getItem(destFilename)) {
        return;
    }
    localStorage.setItem(destFilename, true);
    // Fetch the image from the internet
    fetch(imageUrl).then(function (response) {
        // We need an arrayBuffer of the file contents
        return response.arrayBuffer();
    }).then(buffer => Image.from(buffer, "image/jpeg"))
    .then(image =>
      image.export("image/jpeg", {
        background: "#FFFFFF"
      })
    ).then(function (data) {
        // Queue the file for transfer
        outbox.enqueue(destFilename, data).then(function (ft) {
        // Queued successfully
        console.log("Transfer of '" + destFilename + "' successfully queued.");
    }).catch(function (error) {
        // Failed to queue
        throw new Error("Failed to queue '" + destFilename + "'. Error: " + error);
    });}).catch(function (error) {
        // Log the error
        console.log("Failure: " + error);
    });
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
    