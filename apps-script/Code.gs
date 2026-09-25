/**
 * Google Docs → GitHub Actions trigger.
 *
 * Adds a "PDF Publish" menu to the Doc. Clicking "Publish to site" POSTs a
 * repository_dispatch event to GitHub, which runs the export-pdf workflow.
 *
 * One-time setup (per Doc / container-bound script):
 *   1. Extensions → Apps Script, paste this file.
 *   2. Project Settings → Script Properties, add:
 *        GITHUB_TOKEN  = a fine-grained PAT with "Contents: read/write" on the repo
 *                        (repository_dispatch needs the Contents write scope)
 *        GITHUB_OWNER  = the repo owner (e.g. "0spotter0")
 *        GITHUB_REPO   = the repo name (e.g. "google-doc-to-pdf-workflow")
 *        EVENT_TYPE    = the repository_dispatch event type (e.g. "export-pdf")
 *   3. Reload the Doc; run once to grant the UrlFetch authorization prompt.
 */

function onOpen() {
  DocumentApp.getUi()
    .createMenu("PDF Publish")
    .addItem("Publish to site", "triggerBuild")
    .addToUi();
}

function triggerBuild() {
  const ui = DocumentApp.getUi();
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty("GITHUB_TOKEN");
  const owner = props.getProperty("GITHUB_OWNER");
  const repo = props.getProperty("GITHUB_REPO");
  const eventType = props.getProperty("EVENT_TYPE");

  if (!token || !owner || !repo || !eventType) {
    ui.alert("Missing GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, or EVENT_TYPE in Script Properties (Project Settings).");
    return;
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/dispatches`;
  const payload = {
    event_type: eventType,
    client_payload: {
      docId: DocumentApp.getActiveDocument().getId(),
    },
  };

  const response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();
  if (code === 204) {
    ui.alert("Build triggered. Check redeployment in a few minutes.");
  } else {
    ui.alert(`Failed to trigger build. (HTTP ${code}):\n${response.getContentText()}`);
  }
}
