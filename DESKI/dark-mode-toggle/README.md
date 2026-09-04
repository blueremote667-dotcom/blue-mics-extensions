# Simple Dark Mode

One click to apply a dark filter to any website. Remembers your choice per
site, so it comes back on automatically next time you visit.

## Load it
1. Unzip this folder.
2. Go to `chrome://extensions`, enable **Developer mode**.
3. Click **Load unpacked**, select this folder.

## How it works
- Click the extension icon to toggle dark mode for the current site.
- An "ON" badge shows on the icon when active for that tab.
- Uses a CSS `invert()` + `hue-rotate()` filter (images/video are
  re-inverted so they still look correct), applied via
  `chrome.scripting.insertCSS`.
