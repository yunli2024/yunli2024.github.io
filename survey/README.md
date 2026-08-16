# Survey page

This directory is a plain static GitHub Pages survey prototype. When merged
into the `yunli2024.github.io` repository it is available at:

```text
https://yunli2024.github.io/survey/
```

No build step or backend is required. Serve the repository root locally for
preview:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/survey/`.

## Configuration

Edit only `config.js` for ordinary study changes:

- `questionnaireUrl`: the final Tencent Survey (`wj.qq.com`) URL;
- `assignmentManifestId`: the version of the private candidate-to-method
  manifest used for analysis;
- `criteria`: the five current paper-draft placeholder criteria;
- `tasks`: task text and opaque candidate video paths;
- `candidateLabels`: public anonymous labels.

An empty candidate `src` renders an animated demo placeholder. Real formal
assets should use opaque paths such as `assets/t01/a.mp4`; do not use method,
checkpoint, or output-directory names in any public path or browser-visible
configuration.

## Formal-release checklist

- Replace every demo stimulus and remove the visible pilot/demo notices.
- Freeze the task manifest, criterion wording, candidate order, and app version.
- Keep the task-specific opaque candidate-token to method/output mapping in a
  private immutable manifest. The browser payload records only the randomized
  A/B/C/D-to-token assignment.
- Configure and test the Tencent Survey link and response-code field.
- Collect a stable pre-assigned participant code in Tencent Survey; the local
  browser session ID is not a participant identity.
- Keep method identity and the candidate-to-method mapping outside this public
  repository.
- Remove the `noindex` meta tag only if public indexing is intended.
- Test simultaneous playback, mobile layout, keyboard navigation, response
  persistence, copy-to-clipboard, and a complete Tencent Survey submission.

The current page is a visual and interaction prototype only. It does not
collect data and must not be used as paper evidence.
