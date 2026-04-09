import { MESSAGE_TYPES } from "./shared/constants.js";
import { getReminderState, sortNotes } from "./shared/note-state.js";
import { createNoteId, getNotes, getNotesForUrl, normalizeUrl } from "./shared/storage.js";
import { createBellIcon, createCheckIcon, createEditIcon, createTrashIcon } from "./popup/icons.js";

const form = document.getElementById("note-form");
const noteIdInput = document.getElementById("note-id");
const noteCompletedAtInput = document.getElementById("note-completed-at");
const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const reminderInput = document.getElementById("reminder");
const attachUrlInput = document.getElementById("attach-url");
const statusElement = document.getElementById("status");
const notesList = document.getElementById("notes-list");
const emptyState = document.getElementById("empty-state");
const filterPageButton = document.getElementById("filter-page-button");
const resetButton = document.getElementById("reset-button");

let currentTabUrl = null;
let currentFilter = "all";

bootstrap().catch((error) => {
  setStatus(error.message || "Unable to load Notiva.");
});

async function bootstrap() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTabUrl = normalizeUrl(activeTab?.url || null);

  form.addEventListener("submit", handleSubmit);
  resetButton.addEventListener("click", resetForm);
  filterPageButton.addEventListener("click", togglePageFilter);

  if (!currentTabUrl) {
    attachUrlInput.checked = false;
    attachUrlInput.disabled = true;
  }

  await renderNotes();
}

async function handleSubmit(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title && !content) {
    setStatus("Add a title or note content before saving.");
    return;
  }

  const reminderTimestamp = reminderInput.value ? new Date(reminderInput.value).getTime() : null;
  if (reminderTimestamp && reminderTimestamp <= Date.now()) {
    setStatus("Reminder must be set in the future.");
    return;
  }

  const note = {
    id: noteIdInput.value || createNoteId(),
    title: title || "Untitled note",
    content,
    url: attachUrlInput.checked ? currentTabUrl : null,
    reminderTimestamp,
    completedAt: noteCompletedAtInput.value ? Number(noteCompletedAtInput.value) : null,
    createdAt: noteIdInput.value ? undefined : Date.now()
  };

  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.SAVE_NOTE,
    note
  });

  if (response?.error) {
    setStatus(response.error);
    return;
  }

  resetForm();
  setStatus("Note saved.");
  await renderNotes();
}

async function renderNotes() {
  const notes = await getNotes();
  const filteredNotes = currentFilter === "page" ? getNotesForUrl(notes, currentTabUrl) : notes;
  const sortedNotes = [...filteredNotes].sort(sortNotes);

  notesList.replaceChildren();
  emptyState.hidden = sortedNotes.length > 0;

  sortedNotes.forEach((note) => {
    notesList.appendChild(createNoteCard(note));
  });

  filterPageButton.textContent = currentFilter === "page" ? "Show all" : "Current page";
}

function createNoteCard(note) {
  const item = document.createElement("li");
  const reminderState = getReminderState(note);
  item.className = [
    "note-card",
    reminderState === "due" ? "note-card-due" : "",
    note.completedAt ? "note-card-completed" : ""
  ].filter(Boolean).join(" ");

  const header = document.createElement("div");
  header.className = "note-card-header";

  const title = document.createElement("h3");
  title.textContent = note.title || "Untitled note";

  header.appendChild(title);

  if (note.completedAt) {
    const completedPill = document.createElement("span");
    completedPill.className = "reminder-pill completed-pill";
    completedPill.append(createCheckIcon(), document.createTextNode("Completed"));
    header.appendChild(completedPill);
  } else if (reminderState !== "none") {
    const reminderPill = document.createElement("span");
    reminderPill.className = `reminder-pill${reminderState === "due" ? " reminder-pill-due" : ""}`;
    reminderPill.append(createBellIcon(), document.createTextNode(reminderState === "due" ? "Reminder due" : "Reminder set"));
    header.appendChild(reminderPill);
  }

  const content = document.createElement("p");
  content.className = "note-content";
  content.textContent = note.content || "No content.";

  const createdMeta = document.createElement("p");
  createdMeta.className = "note-meta";
  createdMeta.textContent = `Created ${formatDate(note.createdAt)}`;

  item.append(header, content, createdMeta);

  if (note.reminderTimestamp) {
    const reminderMeta = document.createElement("p");
    reminderMeta.className = "note-meta";
    reminderMeta.textContent = `Reminder ${formatDate(note.reminderTimestamp)}`;
    item.appendChild(reminderMeta);
  }

  if (note.url) {
    const link = document.createElement("a");
    link.className = "note-url";
    link.href = note.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = note.url;
    item.appendChild(link);
  }

  const actions = document.createElement("div");
  actions.className = "note-actions";

  const completeButton = document.createElement("button");
  completeButton.type = "button";
  completeButton.className = `note-icon-button${note.completedAt ? " note-icon-button-active" : ""}`;
  completeButton.title = note.completedAt ? "Mark as incomplete" : "Mark as completed";
  completeButton.setAttribute("aria-label", completeButton.title);
  completeButton.appendChild(createCheckIcon());
  completeButton.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.TOGGLE_NOTE_COMPLETE, noteId: note.id });
    setStatus(note.completedAt ? "Note marked as active." : "Note marked as completed.");
    await renderNotes();
  });

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "note-icon-button";
  editButton.title = "Edit note";
  editButton.setAttribute("aria-label", "Edit note");
  editButton.appendChild(createEditIcon());
  editButton.addEventListener("click", () => populateForm(note));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "note-icon-button note-icon-button-danger";
  deleteButton.title = "Delete note";
  deleteButton.setAttribute("aria-label", "Delete note");
  deleteButton.appendChild(createTrashIcon());
  deleteButton.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DELETE_NOTE, noteId: note.id });
    setStatus("Note deleted.");
    await renderNotes();
  });

  actions.append(completeButton, editButton, deleteButton);
  item.appendChild(actions);

  return item;
}

function populateForm(note) {
  noteIdInput.value = note.id;
  noteCompletedAtInput.value = note.completedAt ? String(note.completedAt) : "";
  titleInput.value = note.title || "";
  contentInput.value = note.content || "";
  reminderInput.value = note.reminderTimestamp ? toDateTimeLocalValue(note.reminderTimestamp) : "";
  attachUrlInput.checked = note.url ? normalizeUrl(note.url) === currentTabUrl : false;
  setStatus("Editing note.");
}

function resetForm() {
  form.reset();
  noteIdInput.value = "";
  noteCompletedAtInput.value = "";
  if (currentTabUrl) {
    attachUrlInput.checked = true;
  }
}

function togglePageFilter() {
  currentFilter = currentFilter === "all" ? "page" : "all";
  renderNotes().catch((error) => setStatus(error.message || "Unable to filter notes."));
}

function setStatus(message) {
  statusElement.textContent = message;
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(timestamp);
}

function toDateTimeLocalValue(timestamp) {
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}