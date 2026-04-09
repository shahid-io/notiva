export function isReminderDue(note) {
  return Boolean(note.reminderTimestamp) && !note.completedAt && Number(note.reminderTimestamp) <= Date.now();
}

export function getReminderState(note) {
  if (!note.reminderTimestamp || note.completedAt) {
    return "none";
  }

  return Number(note.reminderTimestamp) <= Date.now() ? "due" : "scheduled";
}

export function sortNotes(left, right) {
  if (Boolean(left.completedAt) !== Boolean(right.completedAt)) {
    return left.completedAt ? 1 : -1;
  }

  return (right.createdAt || 0) - (left.createdAt || 0);
}
