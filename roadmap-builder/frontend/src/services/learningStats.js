// Small helper for tracking how many hours the user has learned each day.
// Two sources feed into this:
//   1. Focus Mode sessions — actually persisted server-side per user via
//      focusService (see api/routes/focus.js), NOT localStorage. The FOCUS_KEY
//      below is kept only so getDailyHoursMap()'s shape stays stable if local
//      focus data is ever added again; it is never written today.
//   2. Completed lessons (saved under LEARN_KEY by LessonDetails.jsx)
// The dashboard combines both so the weekly chart reflects real activity
// even for users who never open Focus Mode.
//
// IMPORTANT: every key is scoped by userId. Earlier versions of this file
// used one shared key for everyone on the browser, so a brand-new account
// would show a previous account's completed-lesson history (the "weekly
// consistency chart shows progress on a new account" bug). Keys are now
// namespaced per user, and the old shared keys are deleted on first load so
// they can never leak into any account again.

const FOCUS_KEY = "rb_focus_stats";
const LEARN_KEY = "rb_learn_stats";

let legacyKeysCleared = false;

function clearLegacySharedKeys() {
  if (legacyKeysCleared) return;
  legacyKeysCleared = true;

  try {
    localStorage.removeItem(FOCUS_KEY);
    localStorage.removeItem(LEARN_KEY);
  } catch {
    // ignore
  }
}

function scopedKey(base, userId) {
  return `${base}:${userId}`;
}

function readStats(key) {
  if (!key) return { seconds: 0, daily: {} };

  try {
    return JSON.parse(localStorage.getItem(key) || `{"seconds":0,"daily":{}}`);
  } catch {
    return { seconds: 0, daily: {} };
  }
}

function todayKey() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Call this whenever the user completes a lesson, with its estimated minutes.
export function recordLearnedMinutes(minutes, userId) {
  clearLegacySharedKeys();

  const value = Number(minutes);
  if (!value || value <= 0 || !userId) return;

  const key = scopedKey(LEARN_KEY, userId);
  const stats = readStats(key);
  const day = todayKey();

  stats.seconds = Number(stats.seconds || 0) + value * 60;
  stats.daily = stats.daily || {};
  stats.daily[day] = Number(stats.daily[day] || 0) + value * 60;

  localStorage.setItem(key, JSON.stringify(stats));
}

// Hours learned (focus + lessons) for every day that has any data, for one user.
export function getDailyHoursMap(userId) {
  clearLegacySharedKeys();

  if (!userId) return {};

  const focus = readStats(scopedKey(FOCUS_KEY, userId));
  const learn = readStats(scopedKey(LEARN_KEY, userId));
  const days = new Set([...Object.keys(focus.daily || {}), ...Object.keys(learn.daily || {})]);
  const totals = {};

  days.forEach((day) => {
    const focusSeconds = Number(focus.daily?.[day] || 0);
    const learnSeconds = Number(learn.daily?.[day] || 0);
    totals[day] = (focusSeconds + learnSeconds) / 3600;
  });

  return totals;
}

export function getDailyHours(dateKey, userId) {
  return getDailyHoursMap(userId)[dateKey] || 0;
}

// Total hours learned across all recorded days, for one user.
export function getTotalHours(userId) {
  clearLegacySharedKeys();

  if (!userId) return 0;

  const focus = readStats(scopedKey(FOCUS_KEY, userId));
  const learn = readStats(scopedKey(LEARN_KEY, userId));

  return (Number(focus.seconds || 0) + Number(learn.seconds || 0)) / 3600;
}
