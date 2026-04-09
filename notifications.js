const NOTIFICATION_ICON = chrome.runtime.getURL("icons/notiva-128.png");

export function createReminderNotification(note) {
  return new Promise((resolve) => {
    chrome.notifications.create(`notiva-${note.id}`, {
      type: "basic",
      iconUrl: NOTIFICATION_ICON,
      title: `Reminder: ${note.title || "Untitled note"}`,
      message: note.content || "Open Notiva to review your saved note.",
      priority: 2
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Unable to create reminder notification:", chrome.runtime.lastError.message);
        resolve(false);
        return;
      }

      resolve(true);
    });
  });
}

export function clearReminderNotification(notificationId) {
  return new Promise((resolve) => {
    chrome.notifications.clear(notificationId, () => resolve());
  });
}