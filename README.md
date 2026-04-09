# Notiva

Notiva is a Manifest V3 Chrome extension starter for quick notes, page-linked notes, and reminder notifications.

## Included MVP

- Popup note creation, editing, deletion, and listing
- Local persistence with `chrome.storage.local`
- Optional note-to-page linking using the active tab URL
- Reminder scheduling with `chrome.alarms`
- Notification delivery with `chrome.notifications`
- Right-click text selection capture via `chrome.contextMenus`
- Keyboard shortcut command via `quick_note` mapped to `Ctrl+Shift+N` / `Command+Shift+N`
- Full-page dashboard fallback when Chrome blocks popup opening from the shortcut
- Page revisit hint through `content.js`

## Load in Chrome

1. Open `chrome://extensions`
2. Enable Developer mode
3. Choose Load unpacked
4. Select the `notiva` folder

## Notes

- The popup is the main management UI for this starter.
- The `quick_note` command tries to open the popup directly through `chrome.action.openPopup()` and falls back to `dashboard.html` if popup opening is blocked.
- Chrome does not support a `commands` permission entry, so the shortcut is configured through the manifest `commands` block rather than the permissions array.
- For production polish, add real extension icons and a richer dedicated notes dashboard workflow.

## Structure

- `background.js`, `popup.js`, and `content.js` are the runtime entrypoints used by the extension.
- `shared/` contains reusable modules for constants, storage access, notifications, and note state helpers.
- `popup/` contains popup and dashboard UI-only helpers such as icon creation.
- `icons/` contains packaged extension and notification assets.