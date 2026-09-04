const noteEl = document.getElementById("note");
const siteEl = document.getElementById("site");
const statusEl = document.getElementById("status");
const clearBtn = document.getElementById("clearBtn");
const globalToggle = document.getElementById("globalToggle");

let currentKey = "global"; // "note:<hostname>" or "note:global"
let saveTimeout = null;

function keyFor(hostname, useGlobal) {
  return useGlobal ? "note:global" : `note:${hostname}`;
}

function setStatus(text) {
  statusEl.textContent = text;
  if (text) {
    clearTimeout(setStatus._t);
    setStatus._t = setTimeout(() => (statusEl.textContent = ""), 1200);
  }
}

function loadNote(key, displayLabel) {
  currentKey = key;
  siteEl.textContent = displayLabel;
  chrome.storage.local.get([key], (result) => {
    noteEl.value = result[key] || "";
  });
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  let hostname = "this-page";
  try {
    hostname = new URL(tab.url).hostname || "this-page";
  } catch {
    // non-http tab (e.g. chrome:// page) — fall back to global note
  }

  chrome.storage.local.get(["quickNotesUseGlobal"], (result) => {
    const useGlobal = !!result.quickNotesUseGlobal;
    globalToggle.checked = useGlobal;
    loadNote(keyFor(hostname, useGlobal), useGlobal ? "All sites" : hostname);
  });

  globalToggle.addEventListener("change", () => {
    const useGlobal = globalToggle.checked;
    chrome.storage.local.set({ quickNotesUseGlobal: useGlobal });
    loadNote(keyFor(hostname, useGlobal), useGlobal ? "All sites" : hostname);
  });
});

noteEl.addEventListener("input", () => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    chrome.storage.local.set({ [currentKey]: noteEl.value }, () => {
      setStatus("Saved");
    });
  }, 300);
});

clearBtn.addEventListener("click", () => {
  noteEl.value = "";
  chrome.storage.local.remove(currentKey, () => setStatus("Cleared"));
});
