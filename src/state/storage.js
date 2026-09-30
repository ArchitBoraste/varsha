// localStorage may be missing or blocked (private windows, strict settings); state then lives in memory.

export function loadStored(key, sanitize) {
  try {
    return sanitize(JSON.parse(window.localStorage.getItem(key) ?? 'null'));
  } catch {
    return sanitize(null);
  }
}

export function saveStored(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep working from memory.
  }
}
