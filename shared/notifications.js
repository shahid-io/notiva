const NOTIFICATION_ICON = chrome.runtime.getURL("icons/notiva-128.png");

export function createReminderNotification(note) {
  return new Promise((resolve) => {
    const titleText = (note.title || "Untitled note").trim();
    const contentText = (note.content || "").trim();
    const message = contentText
      ? `${titleText}\n${contentText}`
      : titleText;

    chrome.notifications.create(`notiva-${note.id}`, {
      type: "basic",
      iconUrl: NOTIFICATION_ICON,
      title: "Notiva Reminder",
      message,
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
