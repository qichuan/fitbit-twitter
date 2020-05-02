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

// List delegate to bind the view models to the tile list
const delegate = {
  getTileInfo: function (index) {
    console.log(JSON.stringify(tweets[index]));
    return {
      type: "my-pool",
      value: tweets[index],
      index: index,
    };
  },
  configureTile: function (tile, info) {
    if (info.type == "my-pool") {
      if (info.value) {
        tile.getElementById(
          "avatar"
        ).image = `/private/data/avatar_${info.value.author}.jpg`;
        tile.getElementById("fullname").text = info.value.fullName;
        tile.getElementById("author").text = `@${info.value.author}`;
        tile.getElementById("textInstance").getElementById("textarea").text =
          info.value.text;
        utils.updateFooter(tile.getElementById("footer"), info.value);
        tile.isShown = true;
      }

      let touch = tile.getElementById("touch-me");
      touch.onclick = (evt) => {
        console.log(`touched: ${info.index}`);

        // Get a handle on the instance
        const demoinstance = tile.getElementById("demoinstance");
        const textinstance = tile.getElementById("textInstance");

        setTimeout(function () {
          if (tile.isShown) {
            demoinstance.animate("disable");
            textinstance.animate("disable");

            // Hide other UI elements
            tile.getElementById("avatar").style.display = "none";
            tile.getElementById("fullname").style.display = "none";
            tile.getElementById("author").style.display = "none";
            tile.getElementById("footer").style.display = "none";
            onExpand();
            tile.isShown = false;
          } else {
            demoinstance.animate("enable");
            textinstance.animate("enable");

            // SHow other UI elements
            tile.getElementById("avatar").style.display = "inline";
            tile.getElementById("fullname").style.display = "inline";
            tile.getElementById("author").style.display = "inline";
            tile.getElementById("footer").style.display = "inline";
            onCollapse();
            tile.isShown = true;
          }
        }, 100);
      };
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
