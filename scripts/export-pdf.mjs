// Exports a Google Doc as PDF using the Drive API and writes it to disk.
//
// Env vars:
//   GOOGLE_DOC_ID  - the Doc file id to export (required)
//   GDRIVE_SA_KEY  - service-account JSON key, as a string (required)
//   OUTPUT_PATH    - where to write the PDF (default: public/document.pdf)
//
// The Doc must be shared (at least "Viewer") with the service-account email.

import { google } from "googleapis";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const docId = process.env.GOOGLE_DOC_ID;
const saKey = process.env.GDRIVE_SA_KEY;
const outPath = process.env.OUTPUT_PATH || "public/document.pdf";

if (!docId) throw new Error("GOOGLE_DOC_ID is not set");
if (!saKey) throw new Error("GDRIVE_SA_KEY is not set");

let credentials;
try {
  credentials = JSON.parse(saKey);
} catch (err) {
  throw new Error(`GDRIVE_SA_KEY is not valid JSON: ${err.message}`);
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

const drive = google.drive({ version: "v3", auth });

// files.export renders the Doc to PDF server-side (10MB export cap).
const res = await drive.files.export(
  { fileId: docId, mimeType: "application/pdf" },
  { responseType: "arraybuffer" },
);

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, Buffer.from(res.data));

console.log(`Exported Doc ${docId} → ${outPath} (${res.data.byteLength} bytes)`);
