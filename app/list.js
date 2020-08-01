import { utils } from "./utils";

let tweets = [];

let onExpand = () => {};
let onCollapse = () => {};

function setTweets(newTweets) {
  tweets = newTweets;
}

function setOnExpandCallback(callback) {
  onExpand = callback;
}

function setOnCollapseCallback(callback) {
  onCollapse = callback;
}

function expand(tile) {
  const textinstance = tile.getElementById("textInstance");
  textinstance.animate("enable");
  // Change class after the animation is played
  setTimeout(() => {
    textinstance.getElementById("textarea").class = "fullText";
  }, 300);

  // Hide other UI elements
  tile.getElementById("avatar").style.display = "none";
  tile.getElementById("fullname").style.display = "none";
  tile.getElementById("author").style.display = "none";
  tile.getElementById("footer").style.display = "none";
  onExpand();
  tile.isExpanded = true;
}

function collapse(tile) {
  const textinstance = tile.getElementById("textInstance");
  textinstance.animate("disable");
  // Change class after the animation is played
  setTimeout(() => {
    textinstance.getElementById("textarea").class = "digest";
    resetUI(tile);
    onCollapse();
  }, 300);

  tile.isExpanded = false;
}

function resetUI(tile) {
  // SHow other UI elements
  tile.getElementById("avatar").style.display = "inline";
  tile.getElementById("fullname").style.display = "inline";
  tile.getElementById("author").style.display = "inline";
  tile.getElementById("footer").style.display = "inline";
}

// List delegate to bind the view models to the tile list
const delegate = {
  getTileInfo: function (index) {
    return {
      type: "my-pool",
      value: tweets[index],
      index: index,
    };
  },
  configureTile: function (tile, info) {
    if (info.type == "my-pool") {
      if (info.value) {
        // reset the flag and style
        tile.isExpanded = false;
        const textinstance = tile.getElementById("textInstance");
        textinstance.getElementById("textarea").class = "digest";
        resetUI(tile);
        tile.getElementById(
          "avatar"
        ).image = `/private/data/avatar_${info.value.author}.jpg`;
        tile.getElementById("fullname").text =
          (info.value.isRetweeted ? "RT " : "") + info.value.fullName;
        tile.getElementById("author").text = `@${info.value.author}`;
        tile.getElementById("textInstance").getElementById("textarea").text =
          info.value.text;
        utils.updateFooter(tile.getElementById("footer"), info.value);
        tile.getElementById("touch-me").onclick = (evt) => {
          setTimeout(function () {
            if (tile.isExpanded) {
              collapse(tile);
            } else {
              expand(tile);
            }
          }, 100);
        };
      }
    }
  },
};

const listManager = {
  delegate,
  setTweets,
  setOnExpandCallback,
  setOnCollapseCallback,
};

export { listManager };
