# The native Studio port — parked, not deployed

This is the Content Studio running inside HQ without an iframe. It works
plumbing-wise (approvals write to HQ's store and reach the Content Plan) but it
had unresolved layout differences against the original, so Campaigns went back
to embedding `campaigns/index.html` while this gets finished properly.

- `hq-studio-shell.js` — the Studio's markup, verbatim
- `hq-studio.css`      — the Studio's 62KB stylesheet, scoped under `.studio`
- `hq-studio-app.js`   — its 96-function render layer, 22 plumbing edits only

**Nothing here is loaded by index.html.** Finishing it means diffing the
rendered output against the original side by side — not fixing it live.

Two traps already found, both mine:
1. HQ's global rules bleed in (`h1–h3`, `button`, `select`, `ul`, `a`) and it
   collides on `.rail`, `.topbar`, `.wrap`, `.chip`, `.dots`. Revert only the
   properties HQ sets — reverting `margin`/`padding` breaks the Studio's own
   `* { margin: 0 }`, because `.studio p` outranks it.
2. The export handler wires at load and must be deferred to mount.

The design is not ours to reinterpret.
