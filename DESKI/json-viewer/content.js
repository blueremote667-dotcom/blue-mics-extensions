(function () {
  // Only act on pages that look like a raw JSON document: either the browser
  // reports a JSON content type, or the page body is exactly one <pre> tag
  // (how Chrome/Chromium render raw text/JSON responses).
  const contentType = document.contentType || "";
  const looksLikeJsonType = /json/i.test(contentType);

  const bodyChildren = document.body ? document.body.children : [];
  const singlePre =
    bodyChildren.length === 1 && bodyChildren[0].tagName === "PRE";

  if (!looksLikeJsonType && !singlePre) return;

  const rawText = (
    (document.body && (document.body.innerText || document.body.textContent)) ||
    ""
  ).trim();
  if (!rawText) return;

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    return; // Not valid JSON — leave the page alone.
  }

  render(data, rawText);

  function span(cls, text) {
    const s = document.createElement("span");
    if (cls) s.className = cls;
    s.textContent = text;
    return s;
  }

  function valueSpan(value) {
    if (typeof value === "string") return span("jv-string", JSON.stringify(value));
    if (typeof value === "number") return span("jv-number", String(value));
    if (typeof value === "boolean") return span("jv-boolean", String(value));
    if (value === null) return span("jv-null", "null");
    return span("", String(value));
  }

  // Builds one DOM node (a <div class="jv-row">) representing `value`,
  // optionally prefixed with its `key` label. Indentation is handled purely
  // via CSS padding-left on nested containers, so no manual spacing math.
  function buildRow(key, value) {
    const row = document.createElement("div");
    row.className = "jv-row";

    const line = document.createElement("div");
    line.className = "jv-line";
    row.appendChild(line);

    const isContainer = value !== null && typeof value === "object";
    const isArray = Array.isArray(value);
    const entries = isContainer
      ? isArray
        ? value.map((v, i) => [i, v])
        : Object.entries(value)
      : [];
    const isEmpty = isContainer && entries.length === 0;

    if (isContainer && !isEmpty) {
      const toggle = span("jv-toggle", "▾");
      toggle.addEventListener("click", () => row.classList.toggle("jv-collapsed"));
      line.appendChild(toggle);
    } else {
      line.appendChild(span("jv-toggle-spacer", ""));
    }

    if (key !== null) {
      line.appendChild(span("jv-key", JSON.stringify(String(key))));
      line.appendChild(document.createTextNode(": "));
    }

    if (!isContainer) {
      line.appendChild(valueSpan(value));
      return row;
    }

    const openBracket = isArray ? "[" : "{";
    const closeBracket = isArray ? "]" : "}";

    if (isEmpty) {
      line.appendChild(span("jv-bracket", openBracket + closeBracket));
      return row;
    }

    line.appendChild(span("jv-bracket", openBracket));
    line.appendChild(span("jv-count", ` // ${entries.length} ${isArray ? "items" : "keys"}`));

    const children = document.createElement("div");
    children.className = "jv-children";
    for (const [childKey, childValue] of entries) {
      children.appendChild(buildRow(isArray ? null : childKey, childValue));
    }
    row.appendChild(children);

    const closingLine = document.createElement("div");
    closingLine.className = "jv-line jv-closing";
    closingLine.appendChild(span("jv-toggle-spacer", ""));
    closingLine.appendChild(span("jv-bracket", closeBracket));
    row.appendChild(closingLine);

    return row;
  }

  function render(data, rawText) {
    const style = document.createElement("style");
    style.textContent = `
      html, body.json-viewer-active {
        margin: 0;
        background: #ffffff;
      }
      body.json-viewer-active {
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        color: #1f2937;
        font-size: 13px;
        line-height: 1.6;
      }
      .jv-toolbar {
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        background: #059669;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12.5px;
      }
      .jv-toolbar button {
        border: none;
        background: rgba(255,255,255,0.2);
        color: white;
        padding: 4px 10px;
        border-radius: 5px;
        font-size: 12px;
        cursor: pointer;
      }
      .jv-toolbar button:hover { background: rgba(255,255,255,0.35); }
      .jv-toolbar .jv-spacer { flex: 1; }
      #jv-root { padding: 14px 18px 40px; white-space: pre; }
      .jv-line { display: flex; align-items: baseline; gap: 2px; }
      .jv-toggle {
        cursor: pointer;
        user-select: none;
        color: #9ca3af;
        display: inline-block;
        width: 12px;
        flex-shrink: 0;
      }
      .jv-toggle-spacer { display: inline-block; width: 12px; flex-shrink: 0; }
      .jv-children { padding-left: 20px; }
      .jv-row.jv-collapsed > .jv-children,
      .jv-row.jv-collapsed > .jv-closing { display: none; }
      .jv-row.jv-collapsed > .jv-line .jv-count::after { content: " …"; }
      .jv-key { color: #7c3aed; }
      .jv-string { color: #059669; }
      .jv-number { color: #2563eb; }
      .jv-boolean { color: #dc2626; }
      .jv-null { color: #6b7280; font-style: italic; }
      .jv-bracket { color: #374151; }
      .jv-count { color: #9ca3af; font-style: italic; }
      pre.jv-raw {
        display: none;
        padding: 14px 18px 40px;
        font-size: 13px;
        white-space: pre-wrap;
        word-break: break-word;
      }
      body.jv-raw-mode #jv-root { display: none; }
      body.jv-raw-mode pre.jv-raw { display: block; }
    `;
    document.head.appendChild(style);

    document.body.innerHTML = "";
    document.body.classList.add("json-viewer-active");

    const toolbar = document.createElement("div");
    toolbar.className = "jv-toolbar";
    toolbar.innerHTML = `
      <span>🟢 JSON Pretty Viewer</span>
      <div class="jv-spacer"></div>
      <button id="jv-expand-all">Expand all</button>
      <button id="jv-collapse-all">Collapse all</button>
      <button id="jv-toggle-raw">View raw</button>
      <button id="jv-copy">Copy</button>
    `;
    document.body.appendChild(toolbar);

    const root = document.createElement("div");
    root.id = "jv-root";
    root.appendChild(buildRow(null, data));
    document.body.appendChild(root);

    const rawPre = document.createElement("pre");
    rawPre.className = "jv-raw";
    rawPre.textContent = JSON.stringify(data, null, 2);
    document.body.appendChild(rawPre);

    document.getElementById("jv-expand-all").addEventListener("click", () => {
      root.querySelectorAll(".jv-collapsed").forEach((n) => n.classList.remove("jv-collapsed"));
    });
    document.getElementById("jv-collapse-all").addEventListener("click", () => {
      root.querySelectorAll(".jv-row").forEach((n) => {
        if (n.querySelector(":scope > .jv-children")) n.classList.add("jv-collapsed");
      });
    });
    document.getElementById("jv-toggle-raw").addEventListener("click", (e) => {
      const isRaw = document.body.classList.toggle("jv-raw-mode");
      e.target.textContent = isRaw ? "View tree" : "View raw";
    });
    document.getElementById("jv-copy").addEventListener("click", () => {
      navigator.clipboard.writeText(rawText).then(() => {
        const btn = document.getElementById("jv-copy");
        const old = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => (btn.textContent = old), 1000);
      });
    });
  }
})();
