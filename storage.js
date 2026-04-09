const NOTES_KEY = "notiva.notes";

function getLocal(defaultValue) {
  return new Promise((resolve) => {
    chrome.storage.local.get(defaultValue, (result) => {
      resolve(result);
    });
  });
}

function setLocal(value) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(value, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      resolve();
    });
  });
}

export async function getNotes() {
  const result = await getLocal({ [NOTES_KEY]: [] });
  const notes = result[NOTES_KEY];
  return Array.isArray(notes) ? notes : [];
}

export async function saveNotes(notes) {
  await setLocal({ [NOTES_KEY]: notes });
}

export async function upsertNote(note) {
  const notes = await getNotes();
  const index = notes.findIndex((existingNote) => existingNote.id === note.id);

  if (index >= 0) {
    notes[index] = note;
  } else {
    notes.unshift(note);
  }

  await saveNotes(notes);
  return note;
}

export async function deleteNote(noteId) {
  const notes = await getNotes();
  const nextNotes = notes.filter((note) => note.id !== noteId);
  await saveNotes(nextNotes);
}

export function createNoteId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeUrl(url) {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    parsedUrl.hash = "";
    return parsedUrl.toString();
  } catch {
    return url;
  }
}

export function getNotesForUrl(notes, url) {
  const normalizedUrl = normalizeUrl(url);
  return notes.filter((note) => note.url && normalizeUrl(note.url) === normalizedUrl);
}