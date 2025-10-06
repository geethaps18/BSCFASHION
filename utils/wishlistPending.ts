// utils/wishlistPending.ts
const PENDING_KEY = "bsc_wishlist_pending_removals_v1";

export const readPending = (): string[] => {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const writePending = (arr: string[]) => {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(arr));
  } catch {}
};

export const addPending = (id: string) => {
  const arr = readPending();
  if (!arr.includes(id)) arr.push(id);
  writePending(arr);
  return arr;
};

export const removePending = (id: string) => {
  const arr = readPending().filter((x) => x !== id);
  writePending(arr);
  return arr;
};

export const clearPending = () => writePending([]);
