/* SportPharm HQ — start the app once every view has registered. */
document.addEventListener('DOMContentLoaded', () => HQ.start());

/* ---------------------------------------------------------------------------
   Stale-cache guard.

   Every asset is versioned with ?v=N, so a new deploy reaches anyone who
   fetches a fresh index.html. The hole is index.html itself: GitHub Pages
   lets browsers cache it, and a cached index asks for the OLD ?v= numbers —
   which are also cached. The whole page is then a self-consistent copy of an
   old build, and nothing on it can tell.

   That cost a real round trip: an email bug was fixed, deployed and verified
   live while the browser kept sending the old one.

   So: fetch build.txt with a cache-buster, compare it to the build baked into
   index.html, and reload once if they differ. sessionStorage holds the guard
   so a mismatch that somehow persists cannot become a reload loop.
--------------------------------------------------------------------------- */
(() => {
  const RELOADED = 'sphq-cache-reload';
  fetch('build.txt?t=' + Date.now(), { cache: 'no-store' })
    .then(r => (r.ok ? r.text() : null))
    .then(latest => {
      if (!latest) return;
      const live = String(latest).trim();
      const mine = String(window.HQ_BUILD || '').trim();
      if (!live || !mine || live === mine) { sessionStorage.removeItem(RELOADED); return; }
      if (sessionStorage.getItem(RELOADED) === live) {
        /* Already tried and still behind — say so rather than loop. */
        console.warn(`HQ: running build ${mine}, latest is ${live}. A hard refresh (Cmd+Shift+R) will pick it up.`);
        return;
      }
      sessionStorage.setItem(RELOADED, live);
      location.replace(location.pathname + '?b=' + live + location.hash);
    })
    .catch(() => {});
})();
