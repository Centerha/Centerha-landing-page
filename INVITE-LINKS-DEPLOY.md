# Team invite links — deployment notes (operator)

The mobile app + backend now support shareable team invite links of the form:

    https://web.centerha.software/invite/team/<token>

This repo carries the web fallback for people who open the link WITHOUT the
app installed. Three pieces, all already in the tree:

1. `invite/team/index.html` — the fallback page. Reads the token from the
   path (`/invite/team/<token>`) or from `?t=<token>`, calls the public
   `GET api.centerha.software/api/teams/invites/link/resolve` endpoint for a
   safe preview (team name, inviter, member count, expiry), and shows an
   "open in app" button. Degrades gracefully when the API is unreachable.
2. `404.html` — static-hosting shim: `/invite/team/<token>` has no physical
   file, so hosts that serve `404.html` for unknown paths (e.g. GitHub
   Pages) re-route it to `/invite/team/?t=<token>`.
   **If the site is served by nginx instead**, skip the shim by adding:
       location ~ ^/invite/team/[^/]+$ { try_files /invite/team/index.html =404; }
3. `.well-known/assetlinks.json.template` — Android App Links verification.
   **Action required before app links auto-open the app:**
   - Get the RELEASE signing cert fingerprint (never commit the keystore):
       keytool -list -v -keystore <release.keystore> -alias <alias> | grep SHA256
   - Copy the template to `.well-known/assetlinks.json` and replace
     `REPLACE_WITH_RELEASE_SIGNING_CERT_SHA256` with the fingerprint
     (colon-separated uppercase hex, e.g. `AA:BB:...`).
   - Ensure the host serves `/.well-known/assetlinks.json` with
     `Content-Type: application/json` (GitHub Pages does; nginx may need a
     types entry).
   - Verify with:
       https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://web.centerha.software&relation=delegate_permission/common.handle_all_urls
   Until this is deployed, invite links still work — Android just shows the
   browser/app chooser instead of opening the app directly, and the debug
   build won't auto-verify (its cert differs from release).

Backend knobs (already validated in `env.validation.ts`, both optional):
- `TEAM_INVITE_LINK_EXPIRY_DAYS` (default 7)
- `TEAM_INVITE_LINK_BASE_URL` (default `https://web.centerha.software/invite/team`)

CORS: `web.centerha.software` is already in the backend `CORS_ORIGIN` list,
which the fallback page's resolve call relies on.
