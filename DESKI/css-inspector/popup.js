const toggleBtn = document.getElementById("toggleBtn");

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function refreshButtonState() {
  const tab = await getActiveTab();
  if (!tab || !tab.id) return;
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => !!window.__cssInspectorActive,
    });
    setButtonState(!!result);
  } catch {
    // Can't run on this page (e.g. chrome:// URL) — leave default state.
  }
}

function setButtonState(active) {
  toggleBtn.textContent = active ? "Disable Inspector" : "Enable Inspector";
  toggleBtn.classList.toggle("active", active);
}

toggleBtn.addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab || !tab.id) return;

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["inspector.js"],
  });

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => !!window.__cssInspectorActive,
  });
  setButtonState(!!result);
});

refreshButtonState();
