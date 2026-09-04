# JSON Pretty Viewer

Automatically formats raw JSON pages (like API responses opened directly in
the browser) into a readable, collapsible, color-coded tree.

## Load it
1. Unzip this folder.
2. Go to `chrome://extensions`, enable **Developer mode**.
3. Click **Load unpacked**, select this folder.

## How it works
- Runs automatically on any page whose body is raw JSON (e.g. visiting an
  API endpoint URL directly, or a `.json` file).
- Click the ▾ next to `{` or `[` to collapse/expand a section.
- "Expand all" / "Collapse all" toggle everything at once.
- "View raw" shows the original unformatted JSON text.
- "Copy" copies the raw JSON to your clipboard.
