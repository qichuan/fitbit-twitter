// Import Fitbit SDK libraries
import document from "document";
import * as messaging from "messaging";
import { inbox } from "file-transfer";
import fs from "fs";
import { listDirSync } from "fs";

// Import external 3rd party library
import analytics from "fitbit-google-analytics/app";

// Import UI utils
import { utils } from "./utils";
import { listManager } from "./list";

///////////////////////////////////////////////
// START OF THE MAIN PROCEDURE
///////////////////////////////////////////////

// Initialize the analytics
analytics.configure({
  tracking_id: "UA-131470263-1",
});

const TWEETS_FILE_NAME = "tweets.cbor";

// The tile list
let list = document.getElementById("my-list");
list.overflow = "visible";

list.onlistforward = (evt) => {
  currentIndex = evt.middle;
  updateComboButtonStatus();
};

list.onlistbackward = (evt) => {
  currentIndex = evt.middle;
  updateComboButtonStatus();
};

// The welcome texts
let welcomeLine1 = document.getElementById("welcome_line1");
let welcomeLine2 = document.getElementById("welcome_line2");

// The combo buttons
let retweetButton = document.getElementById("btn-retweet");
let likeButton = document.getElementById("btn-like");

// The combo button initial status is disabled
likeButton.state = "disabled";
retweetButton.state = "disabled";

let comboEnabled = false;

function updateComboButtonStatus() {
  const tweet = tweets[currentIndex];
  if (comboEnabled) {
    likeButton.state = tweet.favorited && comboEnabled ? "disabled" : "enabled";
    retweetButton.state =
      tweet.retweeted && comboEnabled ? "disabled" : "enabled";
  } else {
    likeButton.state = "disabled";
    retweetButton.state = "disabled";
  }
}

likeButton.onactivate = (evt) => {
  // Update model
  tweets[currentIndex].likes = tweets[currentIndex].likes + 1;
  tweets[currentIndex].favorited = true;

  // Update view
  document.getElementsByClassName("footer").forEach((element) => {
    if (element.tweetId === tweets[currentIndex].id) {
      utils.updateFooter(element, tweets[currentIndex]);
    }
  });
  updateComboButtonStatus();

  // Send like request to tweeter server
  send({
    what: "like",
    data: tweets[currentIndex].id,
  });

  // Send analytics data
  analytics.send({
    hit_type: "event",
    event_category: "Display",
    event_action: "Tap",
    event_label: "Like",
  });
};

retweetButton.onactivate = (evt) => {
  // Update model
  tweets[currentIndex].retweeted = true;

  // Update view
  updateComboButtonStatus();

  // Send like request to tweeter server
  send({
    what: "retweet",
    data: tweets[currentIndex].id,
  });

  // Send analytics data
  analytics.send({
    hit_type: "event",
    event_category: "Display",
    event_action: "Tap",
    event_label: "Retweet",
  });
};

// The spinner
let spinner = document.getElementById("spinner");

// Start the spinner
spinner.state = "enabled";

// The array to store the tweets
let tweets = [];

// The current index;
let currentIndex = 0;

// Read the tweets from file if any
setTimeout(function () {
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
    what: "appReady",
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
  if (message.what === "loginStatus") {
    // Hide the welcome text if user has already logged in
    if (message.data) {
      // Send analytics data
      analytics.send({
        hit_type: "screenview",
        screen_name: "Main View",
      });

      welcomeLine1.style.visibility = "hidden";
      welcomeLine2.style.visibility = "hidden";
      list.style.visibility = "visible";
    } else {
      // Send analytics data
      analytics.send({
        hit_type: "screenview",
        screen_name: "Welcome View",
      });

      welcomeLine1.style.visibility = "visible";
      welcomeLine2.style.visibility = "visible";
      list.style.visibility = "hidden";

      // Delete tweets file and all avatar files
      const listDir = fs.listDirSync("/private/data");
      let dirIter;
      while ((dirIter = listDir.next()) && !dirIter.done) {
        const filename = dirIter.value;
        if ("tweets.cbor" === filename || 0 === filename.indexOf("avatar_")) {
          try {
            fs.unlinkSync(filename);
            console.log("Successfully deleted file " + filename);
          } catch (e) {
            // ignore
            console.log("Delete file error " + e);
          }
        }
      }
    }
  } else if (message.what === "spinner") {
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
          // Enable the combo buttons only if the tweets are retrieved from remote server
          // Which means the Internet connectivity is most likely available for the app to
          // send like and retweet requests
          comboEnabled = true;
          updateComboButtonStatus();
        }
      }
    }
  } while (fileName);
};

/////////////////////////////////////////////////
// END OF EVENT TRIGGER CALLBACK IMPLEMENTATION
/////////////////////////////////////////////////

/**
 * Read the tweets from given local file if any.
 *
 * @param {string} fileName the file to be read
 * @returns {Array} an array of tweets from the local file if it exits and readable, null otherwise
 */
function readTweetsFromFile(fileName) {
  try {
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

  // Configure the delegate
  listManager.setTweets(tweets);
  listManager.setOnExpandCallback(() => {
    likeButton.style.display = "none";
    retweetButton.style.display = "none";
  });
  listManager.setOnCollapseCallback(() => {
    likeButton.style.display = "inline";
    retweetButton.style.display = "inline";
  });

  // Set the delgate
  list.delegate = listManager.delegate;
  list.length = tweetList.length;
  spinner.state = "disabled";
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
