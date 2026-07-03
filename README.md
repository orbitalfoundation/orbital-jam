# @orbitalfoundation/jam

A multiuser project-jamming web interface over an [orbital filespace](../orbital-filespace) — Svelte 5, slash-routed, data-forward. The UX carries over the choices proven in `social/jam`: tiny floating chrome, full-bleed view takeover, cards for discovery, coral accent, no hairlines/no radius, auto dark mode, mobile-first.

- **The URL is the slug.** `/anselm/tenerife` routes to that node; the entity
  chooses its view (`about.view` — `chat` renders the conversational takeover,
  default is a folder of cards).
- **Identity is a secp256k1 key; you choose who holds it.** `join` offers two
  paths: **sign in with Google** (Web3Auth v9 no-modal, redirect mode — the
  key is derived client-side from threshold shares; convenience + recovery,
  custody effectively delegated to Web3Auth gated by your Google account), or
  a **local key** (yours alone, localStorage, no recovery — mint fresh or
  paste a secret key to restore one). Either way every write is a signed
  envelope the filespace core verifies (proven by `test/crypto.test.js`); the
  server never sees a session or token. Share your public key (⧉) to get
  invited; copy your secret key (🔑) to back up or carry your identity —
  including out of Web3Auth entirely. A restored key recovers its handle
  automatically by looking up the root folder it owns. Web3Auth needs
  `VITE_WEB3AUTH_CLIENT_ID` in `.env` (see `.env.example`), the serving
  origins whitelisted on the dashboard, and key export enabled; without a
  client id, jam falls back to local keys only.
- **Live.** The app subscribes to the server's `changed` fan-out and refreshes
  the folder you're looking at when anyone touches it.
- **Chat is a view, not a layer.** The composer is present but disabled until
  the streams layer lands; the view paints the folder's objects into the
  conversation meanwhile.

## Develop

```sh
npm install
npm run dev        # vite on :5173, proxying socket.io to an orbital-server on :8080
npm test           # browser-crypto ↔ filespace-core compatibility
```

## Ship

```sh
npm run build      # → dist/
cd ../orbital-server && npm start -- --web ../orbital-jam/dist --public ./public
```

## Known v0 tradeoffs

- Keys live only in localStorage — sign-out destroys identity (web3auth /
  wallet custody is the later graft; the tricky-but-valuable web3auth flow
  already exists in orbital-sim's sessions.js to scavenge).
- Private-area changes don't fan out to members yet (server filters to
  guest-readable); members see updates on navigation.
- Creation UX is `prompt()`-grade on purpose — the plateau is life, then grind.
