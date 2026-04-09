export const MESSAGE_TYPES = {
  GET_PAGE_NOTES: "notiva:get-page-notes",
  SAVE_NOTE: "notiva:save-note",
  DELETE_NOTE: "notiva:delete-note",
  TOGGLE_NOTE_COMPLETE: "notiva:toggle-note-complete"
};

export const CONTEXT_MENU_ID = "notiva-save-selection";
export const ALARM_PREFIX = "note:";

export function getAlarmName(noteId) {
  return `${ALARM_PREFIX}${noteId}`;
}
