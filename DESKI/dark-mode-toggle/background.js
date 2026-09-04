const DARK_CSS = `
  html {
    filter: invert(1) hue-rotate(180deg) contrast(0.9) !important;
    background: #fff !important;
  }
  img, video, picture, canvas, svg, iframe {
    filter: invert(1) hue-rotate(180deg) !important;
  }
`;
const CSS_KEY_PREFIX = "dark:"; // storage key: dark:<hostname> -> boolean

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function isInjectablePage(url) {
  return !!url && /^https?:\/\//i.test(url);
}

async function isEnabledFor(hostname) {
  if (!hostname) return false;
  const key = CSS_KEY_PREFIX + hostname;
  const result = await chrome.storage.local.get([key]);
  return !!result[key];
}

async function setEnabledFor(hostname, enabled) {
  const key = CSS_KEY_PREFIX + hostname;
  await chrome.storage.local.set({ [key]: enabled });
}

async function applyCss(tabId) {
  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      css: DARK_CSS,
    });
  } catch (e) {
    // Page may not allow injection (e.g. chrome web store) — ignore.
  }
}

async function removeCss(tabId) {
  try {
    await chrome.scripting.removeCSS({
      target: { tabId },
      css: DARK_CSS,
    });
  } catch (e) {
    // ignore
  }
}

async function updateBadge(tabId, enabled) {
  chrome.action.setBadgeText({ tabId, text: enabled ? "ON" : "" });
  chrome.action.setBadgeBackgroundColor({ tabId, color: "#111827" });
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !isInjectablePage(tab.url)) return;
  const hostname = hostnameFromUrl(tab.url);
  if (!hostname) return;

  const currentlyEnabled = await isEnabledFor(hostname);
  const newState = !currentlyEnabled;
  await setEnabledFor(hostname, newState);

  if (newState) {
    await applyCss(tab.id);
  } else {
    await removeCss(tab.id);
  }
  await updateBadge(tab.id, newState);
});

// Re-apply dark mode automatically when navigating to a site that had it
// enabled previously.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !isInjectablePage(tab.url)) return;
  const hostname = hostnameFromUrl(tab.url);
  const enabled = await isEnabledFor(hostname);
  if (enabled) {
    await applyCss(tabId);
  }
  await updateBadge(tabId, enabled);
});
