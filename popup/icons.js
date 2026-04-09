export function createBellIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("bell-icon");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill", "currentColor");
  path.setAttribute("d", "M12 2a4 4 0 0 0-4 4v1.1c0 1.2-.4 2.4-1.1 3.3L5 13v2h14v-2l-1.9-2.6A5.6 5.6 0 0 1 16 7.1V6a4 4 0 0 0-4-4Zm0 20a3 3 0 0 0 2.8-2H9.2A3 3 0 0 0 12 22Z");
  svg.appendChild(path);

  return svg;
}

export function createCheckIcon() {
  return createStrokeIcon("M20 6 9 17l-5-5");
}

export function createEditIcon() {
  return createStrokeIcon("M4 20h4l10.5-10.5a2.1 2.1 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4");
}

export function createTrashIcon() {
  return createStrokeIcon("M5 7h14M9 7V5h6v2M8 7v12M16 7v12M6 7l1 13h10l1-13");
}

function createStrokeIcon(pathData) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("action-icon");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "1.8");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("d", pathData);
  svg.appendChild(path);

  return svg;
}
