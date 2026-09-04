(function () {
  // This file is (re-)injected every time the popup button is clicked, so it
  // must toggle itself: turn on the first time, tear everything down (and
  // flip the flag) the second time.
  if (window.__cssInspectorActive) {
    if (window.__cssInspectorTeardown) window.__cssInspectorTeardown();
    window.__cssInspectorActive = false;
    return;
  }
  window.__cssInspectorActive = true;

  const STYLE_ID = "css-inspector-injected-style";
  const HIGHLIGHT_ID = "css-inspector-highlight-box";
  const PANEL_ID = "css-inspector-panel";

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${HIGHLIGHT_ID} {
      position: fixed;
      z-index: 2147483646;
      pointer-events: none;
      background: rgba(219, 39, 119, 0.18);
      border: 1.5px solid #db2777;
      border-radius: 2px;
      transition: all 0.05s ease-out;
    }
    #${PANEL_ID} {
      position: fixed;
      z-index: 2147483647;
      bottom: 16px;
      right: 16px;
      width: 300px;
      max-height: 70vh;
      overflow-y: auto;
      background: #111827;
      color: #f9fafb;
      font-family: "SFMono-Regular", Consolas, Menlo, monospace;
      font-size: 12px;
      line-height: 1.6;
      border-radius: 10px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.4);
      padding: 12px 14px;
    }
    #${PANEL_ID} .ci-tag {
      color: #f472b6;
      font-weight: 700;
      font-size: 13px;
    }
    #${PANEL_ID} .ci-selector {
      color: #a5b4fc;
      word-break: break-all;
      margin-bottom: 8px;
      display: block;
    }
    #${PANEL_ID} .ci-row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      border-top: 1px solid #1f2937;
      padding: 3px 0;
    }
    #${PANEL_ID} .ci-prop { color: #9ca3af; }
    #${PANEL_ID} .ci-val { color: #34d399; text-align: right; word-break: break-all; }
    #${PANEL_ID} .ci-close {
      position: absolute;
      top: 8px;
      right: 10px;
      cursor: pointer;
      color: #9ca3af;
      font-size: 14px;
    }
    #${PANEL_ID} .ci-hint {
      color: #6b7280;
      margin-top: 8px;
      font-style: italic;
    }
  `;
  document.head.appendChild(style);

  const highlightBox = document.createElement("div");
  highlightBox.id = HIGHLIGHT_ID;
  highlightBox.style.display = "none";
  document.body.appendChild(highlightBox);

  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.innerHTML = `<span class="ci-hint">Hover an element, then click to lock in its info. Click the extension icon again to turn this off.</span>`;
  document.body.appendChild(panel);

  const PROPS_TO_SHOW = [
    "display",
    "position",
    "width",
    "height",
    "color",
    "background-color",
    "font-size",
    "font-family",
    "font-weight",
    "margin",
    "padding",
    "border",
  ];

  function describeElement(el) {
    const rect = el.getBoundingClientRect();
    highlightBox.style.display = "block";
    highlightBox.style.left = rect.left + "px";
    highlightBox.style.top = rect.top + "px";
    highlightBox.style.width = rect.width + "px";
    highlightBox.style.height = rect.height + "px";
    return rect;
  }

  function buildSelector(el) {
    let selector = el.tagName.toLowerCase();
    if (el.id) selector += `#${el.id}`;
    if (el.classList.length) {
      selector += "." + Array.from(el.classList).join(".");
    }
    return selector;
  }

  function renderPanel(el) {
    const computed = getComputedStyle(el);
    const rows = PROPS_TO_SHOW.map((prop) => {
      const value = computed.getPropertyValue(prop);
      return `<div class="ci-row"><span class="ci-prop">${prop}</span><span class="ci-val">${escapeHtml(value)}</span></div>`;
    }).join("");

    panel.innerHTML = `
      <span class="ci-close" id="ci-close-btn">✕</span>
      <span class="ci-tag">&lt;${el.tagName.toLowerCase()}&gt;</span>
      <span class="ci-selector">${escapeHtml(buildSelector(el))}</span>
      ${rows}
    `;
    const closeBtn = document.getElementById("ci-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", teardown);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function isOwnUi(el) {
    return el.id === HIGHLIGHT_ID || el.closest(`#${PANEL_ID}`);
  }

  function onMouseMove(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || isOwnUi(el)) return;
    describeElement(el);
  }

  let locked = false;

  function onClick(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || isOwnUi(el)) return;
    e.preventDefault();
    e.stopPropagation();
    locked = true;
    renderPanel(el);
  }

  document.addEventListener("mousemove", onMouseMove, true);
  document.addEventListener("click", onClick, true);

  function teardown() {
    document.removeEventListener("mousemove", onMouseMove, true);
    document.removeEventListener("click", onClick, true);
    style.remove();
    highlightBox.remove();
    panel.remove();
    window.__cssInspectorActive = false;
    window.__cssInspectorTeardown = null;
  }

  window.__cssInspectorTeardown = teardown;
})();
