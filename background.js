import { createReminderNotification } from "./notifications.js";
import { createNoteId, deleteNote, getNotes, normalizeUrl, saveNotes, upsertNote } from "./storage.js";

const CONTEXT_MENU_ID = "notiva-save-selection";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Save selection to Notiva",
    contexts: ["selection"]
  });

  refreshActionState().catch((error) => {
    console.error("Unable to initialize Notiva action state:", error);
  });
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "quick_note") {
    return;
  }

  try {
    await chrome.action.openPopup();
  } catch {
    await chrome.tabs.create({
      url: chrome.runtime.getURL("dashboard.html")
    });
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !info.selectionText) {
    return;
  }

  const note = {
    id: createNoteId(),
    title: truncateText(info.selectionText, 60),
    content: info.selectionText.trim(),
    url: normalizeUrl(info.pageUrl || tab?.url || null),
    reminderTimestamp: null,
    createdAt: Date.now()
  };

  await upsertNote(note);
  await refreshActionState();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith("note:")) {
    return;
  }

  const noteId = alarm.name.slice(5);
  const notes = await getNotes();
  const note = notes.find((entry) => entry.id === noteId);

  if (!note) {
    return;
  }

  await createReminderNotification(note);
  await refreshActionState();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "notiva:get-page-notes") {
    getNotes().then((notes) => {
      const pageNotes = notes.filter((note) => note.url && normalizeUrl(note.url) === normalizeUrl(message.url));
      sendResponse({ notes: pageNotes });
    });
    return true;
  }

  if (message?.type === "notiva:save-note") {
    saveOrUpdateNote(message.note)
      .then((note) => sendResponse({ note }))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (message?.type === "notiva:delete-note") {
    deleteStoredNote(message.noteId)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (message?.type === "notiva:toggle-note-complete") {
    toggleNoteComplete(message.noteId)
      .then((note) => sendResponse({ note }))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  return false;
});

async function saveOrUpdateNote(note) {
  const normalizedNote = {
    ...note,
    url: normalizeUrl(note.url),
    createdAt: note.createdAt || Date.now()
  };

  await upsertNote(normalizedNote);
  await syncAlarm(normalizedNote);
  await refreshActionState();
  return normalizedNote;
}

async function deleteStoredNote(noteId) {
  await chrome.alarms.clear(`note:${noteId}`);
  await deleteNote(noteId);
  await refreshActionState();
}

async function toggleNoteComplete(noteId) {
  const notes = await getNotes();
  const note = notes.find((entry) => entry.id === noteId);

  if (!note) {
    throw new Error("Note not found.");
  }

  const nextNote = {
    ...note,
    completedAt: note.completedAt ? null : Date.now()
  };

  await upsertNote(nextNote);
  await syncAlarm(nextNote);
  await refreshActionState();
  return nextNote;
}

async function syncAlarm(note) {
  const alarmName = `note:${note.id}`;
  await chrome.alarms.clear(alarmName);

  if (!note.reminderTimestamp || note.completedAt) {
    return;
  }

  const when = Number(note.reminderTimestamp);
  if (Number.isNaN(when) || when <= Date.now()) {
    return;
  }

  await chrome.alarms.create(alarmName, { when });
}

function truncateText(text, maxLength) {
  const normalizedText = text.trim().replace(/\s+/g, " ");
  if (normalizedText.length <= maxLength) {
    return normalizedText || "Quick note";
  }

  return `${normalizedText.slice(0, maxLength - 1)}…`;
}

async function migrateExistingAlarms() {
  const notes = await getNotes();
  await Promise.all(notes.map((note) => syncAlarm(note)));
  await refreshActionState();
}

async function refreshActionState() {
  const notes = await getNotes();
  const dueCount = notes.filter(isReminderDue).length;

  await chrome.action.setBadgeBackgroundColor({ color: dueCount > 0 ? "#8b3512" : "#c45a2d" });
  await chrome.action.setBadgeText({ text: dueCount > 0 ? String(Math.min(dueCount, 99)) : "" });
  await chrome.action.setTitle({
    title: dueCount > 0
      ? `Notiva (${dueCount} reminder${dueCount === 1 ? "" : "s"} due)`
      : "Notiva"
  });
}

function isReminderDue(note) {
  return Boolean(note.reminderTimestamp) && !note.completedAt && Number(note.reminderTimestamp) <= Date.now();
}

migrateExistingAlarms();