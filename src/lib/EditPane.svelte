<script>
  // the edit pane — revise a node's about component in place: label,
  // description, depiction (paste a URL or pick from suggestions), and the
  // area's default view. One update command; the core gates who may.
  import { session } from './session.svelte.js';
  import { command } from './bus.js';
  import { suggestDepictions } from './depiction.js';

  let { node, onclose, onsaved } = $props();

  const about = node.components?.about ?? {};
  let label = $state(about.label ?? '');
  let description = $state(about.description ?? '');
  let depiction = $state(about.depiction ?? '');
  let credit = $state(about.credit ?? null);
  let view = $state(about.view ?? '');
  let query = $state(about.label ?? '');
  let thumbs = $state([]);
  let searched = $state(false);
  let busy = $state(false);

  async function suggest() {
    busy = true;
    thumbs = await suggestDepictions(query || label);
    searched = true;
    busy = false;
  }

  function pick(p) {
    depiction = p.url;
    credit = p.credit ?? null;
  }

  async function save() {
    busy = true;
    try {
      const next = { ...(node.components?.about ?? {}) };
      const set = (k, v) => (v ? (next[k] = v) : delete next[k]);
      set('label', label.trim());
      set('description', description.trim());
      set('depiction', depiction.trim());
      set('credit', depiction.trim() ? credit : null);
      set('view', view);
      const res = await command(session.identity, 'update', { slug: node.slug, components: { about: next } });
      if (res?.ok === false) return alert(res.error);
      onsaved?.();
      onclose?.();
    } finally {
      busy = false;
    }
  }
</script>

<div class="editor">
  <label>name <input bind:value={label} placeholder="what is this?" /></label>
  <label>description <textarea rows="2" bind:value={description} placeholder="a line or two — it also helps pick a better image"></textarea></label>
  <label>image
    <span class="row">
      <input bind:value={depiction} placeholder="paste an image url — or suggest below" />
      <button onclick={suggest} disabled={busy}>suggest…</button>
    </span>
  </label>
  {#if thumbs.length}
    <div class="thumbs">
      {#each thumbs as p (p.url)}
        <img src={p.thumb} alt={p.credit ?? ''} title={p.credit ? `photo: ${p.credit}` : ''} class:sel={depiction === p.url}
          onclick={() => pick(p)} />
      {/each}
    </div>
    {#if credit}<span class="meta">photo: {credit} (unsplash)</span>{/if}
  {:else if searched}
    <span class="meta">no images found — is UNSPLASH_ACCESS_KEY configured on the server?</span>
  {/if}
  <label>default view
    <select bind:value={view}>
      <option value="">folder (cards)</option>
      <option value="chat">chat</option>
    </select>
  </label>
  <span class="row">
    <button class="primary" onclick={save} disabled={busy}>save</button>
    <button onclick={() => onclose?.()}>cancel</button>
  </span>
</div>
