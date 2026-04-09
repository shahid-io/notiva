(async function initNotivaPageHint() {
  if (!window.location?.href.startsWith("http")) {
    return;
  }

  const response = await chrome.runtime.sendMessage({
    type: "notiva:get-page-notes",
    url: window.location.href
  });

  if (!response?.notes?.length) {
    return;
  }

  renderHint(response.notes);
})();

function renderHint(notes) {
  const existing = document.getElementById("notiva-page-hint");
  if (existing) {
    existing.remove();
  }

  const noteCount = notes.length;
  const hasDueReminder = notes.some((note) => note.reminderTimestamp && Number(note.reminderTimestamp) <= Date.now());

  const hint = document.createElement("button");
  hint.id = "notiva-page-hint";
  hint.type = "button";
  hint.textContent = hasDueReminder
    ? noteCount === 1
      ? "Reminder due for 1 note on this page"
      : `Reminders due for ${noteCount} notes on this page`
    : noteCount === 1
      ? "You have 1 note for this page"
      : `You have ${noteCount} notes for this page`;
  hint.style.position = "fixed";
  hint.style.right = "16px";
  hint.style.bottom = "16px";
  hint.style.zIndex = "2147483647";
  hint.style.padding = "12px 14px";
  hint.style.border = "0";
  hint.style.borderRadius = "999px";
  hint.style.background = hasDueReminder ? "#8b3512" : "#1f1a17";
  hint.style.color = "#fff8ed";
  hint.style.boxShadow = hasDueReminder ? "0 12px 30px rgba(139, 53, 18, 0.28)" : "0 12px 30px rgba(31, 26, 23, 0.24)";
  hint.style.font = '13px "Avenir Next", "Segoe UI", sans-serif';
  hint.style.cursor = "pointer";
  hint.style.opacity = "0";
  hint.style.transform = "translateY(8px)";
  hint.style.transition = "opacity 160ms ease, transform 160ms ease";
  hint.addEventListener("click", () => hint.remove());

  document.body.appendChild(hint);

  requestAnimationFrame(() => {
    hint.style.opacity = "1";
    hint.style.transform = "translateY(0)";
  });

  window.setTimeout(() => {
    hint.style.opacity = "0";
    hint.style.transform = "translateY(8px)";
    window.setTimeout(() => hint.remove(), 180);
  }, 4200);
}