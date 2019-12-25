// Import Fitbit SDK libraries
import document from "document";
import * as messaging from "messaging";
import {inbox} from "file-transfer";
import fs from "fs";
import { listDirSync } from "fs";

// Import external 3rd party library
import analytics from "fitbit-google-analytics/app"

// Import common utils
import {utils} from "../common/utils";

///////////////////////////////////////////////
// START OF THE MAIN PROCEDURE
///////////////////////////////////////////////

// Initialize the analytics
analytics.configure({
    tracking_id: "UA-131470263-1"
});

const TWEETS_FILE_NAME = "tweets.cbor";

// The tile list
let list = document.getElementById("my-list");

// The welcome texts
let welcomeLine1 = document.getElementById("welcome_line1");
let welcomeLine2 = document.getElementById("welcome_line2");

// The combo butons
let retweetButton = document.getElementById("btn-retweet");
let likeButton = document.getElementById("btn-like");

likeButton.state = "disabled";
retweetButton.state = "disabled";

// The spinner
let spinner = document.getElementById("spinner");

// Start the spinner
spinner.state = "enabled";

// The array to store the tweets
let tweets = [];

// The current tweetId;
let currentTweetId = null;

// Read the tweets from file if any
setTimeout(function(){ 
    const data = readTweetsFromFile(TWEETS_FILE_NAME);
    if (data) {
         setTweetListToTileList(data);
    }
}, 500);

///////////////////////////////////////////////
// END OF THE MAIN PROCEDURE
///////////////////////////////////////////////

/////////////////////////////////////////////////
// START OF EVENT TRIGGER CALLBACK IMPLEMENTATION
/////////////////////////////////////////////////

// Listen for the onopen event
messaging.peerSocket.onopen = function () {
    // Inform the companion that the app is ready
    const data = {
        what: 'appReady'
    };
    send(data);
};

// Listen for the onerror event
messaging.peerSocket.onerror = function (err) {
    // Handle any errors
    console.log("Connection error: " + err.code + " - " + err.message);
};

// Listens for message events
messaging.peerSocket.onmessage = function (evt) {
    const message = evt.data;
    if (message.what === 'loginStatus') {
        // Hide the welcome text if user has already logged in
        if (message.data) {
            welcomeLine1.style.visibility = "hidden";
            welcomeLine2.style.visibility = "hidden";
            list.style.visibility = "visible";
            likeButton.state = "enabled";
            retweetButton.state = "enabled";
        } else {
            welcomeLine1.style.visibility = "visible";
            welcomeLine2.style.visibility = "visible";
            list.style.visibility = "hidden";
            likeButton.state = "disabled";
            retweetButton.state = "disabled";

            // Delete tweets file and all avatar files
            const listDir = fs.listDirSync("/private/data");
            let dirIter;
            while((dirIter = listDir.next()) && !dirIter.done) {
                const filename = dirIter.value;
                if ( "tweets.cbor" === filename || 0 === filename.indexOf("avatar_")) {
                    try {
                        fs.unlinkSync(filename);
                        console.log("Successfully deleted file " + filename);
                    }
                    catch (e) {
                        // ignore
                        console.log("Delete file error " + e);
                    }
                }
            }
        }
    } else if (message.what === 'spinner') {
        if (message.data) {
            // Start the spinner
            spinner.state = "enabled";
        } else {
            spinner.state = "disabled";
        }
    }
};

// Listen to incoming file events
inbox.onnewfile = () => {
    let fileName;
    do {
        // If there is a file, move it from staging into the application folder
        fileName = inbox.nextFile();

        if (fileName) {
            console.log(`Received File: <${fileName}>`);
            if (fileName === "tweets.cbor") {
                const data = readTweetsFromFile(fileName);
                if (data) {
                    setTweetListToTileList(data);
                }
            }
        }
    } while (fileName);
};

/////////////////////////////////////////////////
// END OF EVENT TRIGGER CALLBACK IMPLEMENTATION
/////////////////////////////////////////////////

// List delegate to bind the view models to the tile list
const listDelegate = {
    getTileInfo: function (index) {
        return {
            type: "my-pool",
            value: tweets[index],
            index: index
        };
    },
    configureTile: function (tile, info) {
        if (info.type == "my-pool") {
            if (info.value) {
                tile.getElementById("avatar").image = `/private/data/avatar_${info.value.author}.jpg`;
                tile.getElementById("fullname").text = info.value.fullName;
                tile.getElementById("author").text = `@${info.value.author}`;
                tile.getElementById("footer").text = `❤️ ${info.value.likes} · ${utils.prettyDate(info.value.createdTime)}`;
                tile.getElementById("text").text = info.value.text;
                tile.getElementById("footer").onclick = evt => {
                    console.log('like ' + info.value.id);
                    send({
                        what: 'like',
                        data: info.value.id
                    });
                }
                currentTweetId = info.value.id;
            }
            // Reserve for future use
            // let touch = tile.getElementById("touch-me");
            // touch.onclick = evt => {
            //     console.log(`touched: ${info.index}`);
            // };
        }
    },
};

 /**
  * Read the tweets from given local file if any.
  * 
  * @param {string} fileName the file to be read
  * @returns {Array} an array of tweets from the local file if it exits and readable, null otherwise
  */
function readTweetsFromFile(fileName) {
    try{
        return fs.readFileSync(fileName, "cbor");
    } catch (e) {
        // ignore
        console.log("read file error");
        return null;
    }
}

/**
 * Associate the list of tweets to the tile list and refresh the UI
 * 
 * @param {Array} tweetList the list of tweets
 */
function setTweetListToTileList(tweetList) {
    tweets = tweetList;
    list.delegate = listDelegate;
    list.length = tweetList.length;
    spinner.state = "disabled";
    likeButton.state = "enabled";
    retweetButton.state = "enabled";
}

/**
 * A convenient method to send data to companion if the peer socket is opened
 * 
 * @param {*} data the data to be sent to companion
 */
function send(data) {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        // Send the data to companion
        messaging.peerSocket.send(data);
    }
}