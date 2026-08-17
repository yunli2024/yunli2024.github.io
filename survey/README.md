# Survey page

This directory is a plain static GitHub Pages survey interface. When merged
into the `yunli2024.github.io` repository it is available at:

```text
https://yunli2024.github.io/survey/1/
https://yunli2024.github.io/survey/2/
```

No build step or backend is required. Serve the repository root locally for
preview:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/survey/1/` or
`http://localhost:8000/survey/2/`. The original `/survey/` route remains as a
schema-v1 compatibility page.

## Configuration

Edit only `config.js` for ordinary study changes:

- `questionnaireUrl`: the final Tencent Survey (`wj.qq.com`) URL;
- `assignmentManifestId`: the version of the private candidate-to-method
  manifest used for analysis;
- `practice`: the three-image, one-question Top-2 practice example and
  bilingual acknowledgement copy;
- `criteria`: the five current paper-draft placeholder criteria;
- `tasks`: 10 bilingual task definitions, each with one input/reference image
  and six opaque candidate final-frame image paths;
- `candidateLabels`: public anonymous labels.

The two form-specific files, `1/form-config.js` and `2/form-config.js`, set only
the form source (`formId`) and compact response schema version. Keep their IDs
fixed when formal responses are collected.

An empty practice, `referenceSrc`, or candidate `src` renders a neutral image placeholder.
Real formal assets should use opaque paths such as `assets/t01/input.png` and
`assets/t01/c01.png`; do not use method,
checkpoint, or output-directory names in any public path or browser-visible
configuration.

## Formal-release checklist

- Add every frozen input image and final-frame result.
- Add the three practice images and confirm that their example does not reveal
  a formal candidate identity.
- Freeze the task manifest, criterion wording, candidate order, and app version.
- Keep the task-specific opaque candidate-token to method/output mapping in a
  private immutable manifest. The browser payload records only the randomized
  A/B/C/D/E/F-to-token assignment.
- Configure and test the Tencent Survey link and response-code field.
- Collect a stable pre-assigned participant code in Tencent Survey; the local
  browser session ID is not a participant identity.
- Keep method identity and the candidate-to-method mapping outside this public
  repository.
- Remove the `noindex` meta tag only if public indexing is intended.
- Test image loading, mobile layout, keyboard navigation, response
  persistence, copy-to-clipboard, and a complete Tencent Survey submission.

The current page is a visual and interaction prototype only. It does not
collect data and must not be used as paper evidence.

## Compact response-code schema

After the practice gate and all formal rows are complete, the page emits one
compact JSON object (abbreviated to one task below for readability):

```json
{"v":2,"s":"visual-removal-preference-v1","m":"six-candidate-last-frame-v1","id":"SV-0123456789AB","t":[1786851000,1786851900],"o":["351624"],"a":[["AB","CF","DE","AC","BF"]],"form_id":1}
```

- `v`: compact response schema version;
- `form_id`: fixed source form, `1` for `/survey/1/` and `2` for `/survey/2/`;
- `s`: frozen study/protocol ID;
- `m`: private assignment-manifest ID;
- `id`: random browser session ID, not a participant identity;
- `t`: UTC start and completion times as Unix seconds;
- `o[i]`: the `A-F` display positions mapped to candidate indices `1-6` for
  task `i` (for example, `351624` means `A -> c3`, `B -> c5`, and so on);
- `a[i][j]`: the sorted, unranked Top-2 labels for task `i`, criterion `j`.

Task and criterion order are resolved by `s`, `m`, and `form_id`. A formal decoder must
reject unknown versions/IDs, malformed permutations, non-canonical answers,
and incomplete matrices rather than guessing.

The practice selection and acknowledgement are stored only as local interface
state. They gate access to the response code and Tencent Survey link but are
not included in the compact formal-study payload.
