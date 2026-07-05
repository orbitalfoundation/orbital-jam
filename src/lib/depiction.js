// depiction — best-guess imagery for entities, via the server's /api/depiction
// proxy (Unsplash; the key lives server-side). Everything here fails soft:
// no key, no network, no matches → empty, and the UI simply stays plain.

export async function suggestDepictions(q) {
  if (!q?.trim()) return [];
  try {
    const res = await fetch(`/api/depiction?q=${encodeURIComponent(q.trim())}`);
    const data = await res.json();
    return data?.ok ? data.photos : [];
  } catch {
    return [];
  }
}

// the "best guess at creation" — first landscape match for the name
export async function bestDepiction(q) {
  const [first] = await suggestDepictions(q);
  return first ?? null;
}

// spread-ready: about-component fields for a picked photo
export const depictionFields = (p) =>
  p ? { depiction: p.url, ...(p.credit && { credit: p.credit }) } : {};
