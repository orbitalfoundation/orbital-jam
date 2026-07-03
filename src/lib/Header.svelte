<script>
  import { navigate } from './router.svelte.js';
  import { session, signIn, signInWeb3Auth, signOut, setHandle } from './session.svelte.js';
  import { configured as w3aConfigured } from './web3auth.js';
  import { command, query } from './bus.js';
  import { shortKey } from './identity.js';

  let busy = $state(false);
  let promptedOnce = false;

  // If this key already owns a root area (a restored identity), adopt that
  // handle instead of asking — the namespace remembers who you are.
  async function adoptOwnedHandle() {
    try {
      const mine = await query('find', { member: session.identity.publicKey }, session.identity);
      const root = mine?.find((n) => n.owner === session.identity.publicKey && n.slug.split('/').filter(Boolean).length === 1);
      if (root) {
        setHandle(root.slug.slice(1));
        return true;
      }
    } catch { /* fall through to claiming */ }
    return false;
  }

  // join = get an identity, then claim /handle first-come.
  // Two ways to hold a key: sign in with Google (web3auth derives it —
  // convenience + recovery), or a local key (sovereignty, no recovery —
  // mint fresh or paste a secret key to restore one).
  async function join() {
    if (!session.identity) {
      busy = true;
      try {
        if (w3aConfigured && confirm('Sign in with Google (via Web3Auth)?\n\nOK — Google sign-in: recoverable, Web3Auth custodies key shares.\nCancel — local key: yours alone, no recovery, portable by copying it.')) {
          await signInWeb3Auth(); // redirect mode: usually never returns
          busy = false;
          if (!session.identity) return; // redirected away
        } else {
          const pasted = prompt('paste a SECRET key to restore an identity — or leave empty to mint a new one:');
          busy = false;
          if (pasted === null) return;
          try {
            signIn(pasted.trim() || null);
          } catch {
            return alert('that is not a valid secret key');
          }
        }
      } catch (err) {
        busy = false;
        return alert(`sign-in failed: ${err.message}`);
      }
    }
    if (await adoptOwnedHandle()) return navigate('/' + session.handle);
    await claimFlow(session.suggested);
  }

  async function claimFlow(suggested = null) {
    let h = prompt('claim your folder — pick a handle (letters/digits, - _ .):', suggested ?? session.handle ?? '');
    if (!h) return;
    h = h.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9._-]*$/.test(h)) return alert('letters/digits first, then letters, digits, - _ .');
    busy = true;
    try {
      const res = await command(session.identity, 'claim', { slug: `/${h}`, components: { about: { label: h } } });
      if (res?.ok === false) {
        // already ours from an earlier visit? then it's a rejoin, not an error
        const existing = await query('get', { slug: `/${h}` }, session.identity);
        if (existing?.owner !== session.identity.publicKey) return alert(res.error);
      }
      setHandle(h);
      navigate(`/${h}`);
    } finally {
      busy = false;
    }
  }

  // after a fresh web3auth sign-in (redirect return): first see whether this
  // key already owns a folder (returning user), else offer the claim once,
  // pre-filled from the email prefix
  $effect(() => {
    if (session.identity && !session.handle && session.suggested && !promptedOnce) {
      promptedOnce = true;
      (async () => {
        if (await adoptOwnedHandle()) navigate('/' + session.handle);
        else claimFlow(session.suggested);
      })();
    }
  });

  async function exportKey() {
    if (!confirm('Copy your SECRET key to the clipboard?\n\nAnyone holding this key IS you. Store it safely; paste it into join on another browser to carry your identity there.')) return;
    await navigator.clipboard.writeText(session.identity.privateKey);
  }

  function leave() {
    const msg = session.kind === 'web3auth'
      ? 'Sign out? Signing back in with Google recovers the same identity.'
      : 'Sign out? This key exists only in this browser and will be destroyed — copy it first (🔑) if you want it back.';
    if (confirm(msg)) signOut();
  }
</script>

<button class="chip logo" onclick={() => navigate('/')}>orbital·jam</button>

<div class="chip who">
  {#if session.identity}
    <button class="plain" onclick={() => (session.handle ? navigate('/' + session.handle) : join())}>
      {session.handle ?? shortKey(session.identity.publicKey)}
    </button>
    <button class="plain dim" title="copy my public key (share it to get invited)"
      onclick={() => navigator.clipboard.writeText(session.identity.publicKey)}>⧉</button>
    <button class="plain dim" title="copy my SECRET key (backup / move browsers — guard it)" onclick={exportKey}>🔑</button>
    <button class="plain dim" title="sign out" onclick={leave}>×</button>
  {:else if session.restoring}
    <span class="plain dim">…</span>
  {:else}
    <button class="plain" onclick={join} disabled={busy}>{busy ? '…' : 'join'}</button>
  {/if}
</div>
