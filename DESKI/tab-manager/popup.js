const searchInput = document.getElementById("search");
const tabListEl = document.getElementById("tabList");
const countEl = document.getElementById("count");

let allTabs = [];

function render(tabs) {
  tabListEl.innerHTML = "";
  countEl.textContent = `${tabs.length} tab${tabs.length === 1 ? "" : "s"}`;

  if (tabs.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No matching tabs";
    tabListEl.appendChild(empty);
    return;
  }

  for (const tab of tabs) {
    const li = document.createElement("li");
    li.className = "tab-item" + (tab.active ? " active" : "");

    const favicon = document.createElement("div");
    favicon.className = "favicon";
    if (tab.favIconUrl) {
      favicon.style.background = `url("${tab.favIconUrl}") center/cover`;
    }

    const info = document.createElement("div");
    info.className = "tab-info";
    const title = document.createElement("div");
    title.className = "tab-title";
    title.textContent = tab.title || "(untitled)";
    const url = document.createElement("div");
    url.className = "tab-url";
    try {
      url.textContent = new URL(tab.url).hostname;
    } catch {
      url.textContent = tab.url || "";
    }
    info.appendChild(title);
    info.appendChild(url);

    const closeBtn = document.createElement("button");
    closeBtn.className = "close-btn";
    closeBtn.textContent = "✕";
    closeBtn.title = "Close tab";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      chrome.tabs.remove(tab.id);
      allTabs = allTabs.filter((t) => t.id !== tab.id);
      applyFilter();
    });

    li.appendChild(favicon);
    li.appendChild(info);
    li.appendChild(closeBtn);

    li.addEventListener("click", () => {
      chrome.tabs.update(tab.id, { active: true });
      chrome.windows.update(tab.windowId, { focused: true });
      window.close();
    });

    tabListEl.appendChild(li);
  }
}

function applyFilter() {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) {
    render(allTabs);
    return;
  }
  const filtered = allTabs.filter(
    (t) =>
      (t.title || "").toLowerCase().includes(q) ||
      (t.url || "").toLowerCase().includes(q)
  );
  render(filtered);
}

searchInput.addEventListener("input", applyFilter);

chrome.tabs.query({}, (tabs) => {
  allTabs = tabs;
  render(allTabs);
});
