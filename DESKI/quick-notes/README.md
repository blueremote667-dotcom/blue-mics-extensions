# Quick Notes

A tiny sticky note tied to whatever website you're on.

## Load it
1. Unzip this folder.
2. Go to `chrome://extensions`, enable **Developer mode**.
3. Click **Load unpacked**, select this folder.

## How it works
- Open the popup on any site and start typing — it autosaves.
- Each site gets its own note (keyed by hostname), stored locally via `chrome.storage.local`.
- Check "Use one note for all sites" to switch to a single global note instead.
- "Clear" wipes the note for the current context.
