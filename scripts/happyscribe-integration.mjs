const apiKey = process.env.HAPPYSCRIBE_API_KEY?.trim();

if (!apiKey) {
  console.log(
    "Skipped. Set HAPPYSCRIBE_API_KEY to check the real HappyScribe account.",
  );
  console.log(
    "This script only lists workspaces and requests a signed upload URL. It does not create a transcription order.",
  );
  process.exit(0);
}

const baseUrl = "https://www.happyscribe.com/api/v1";
const headers = {
  Accept: "application/json",
  Authorization: `Bearer ${apiKey}`,
};

const organizations = await fetch(`${baseUrl}/organizations`, { headers });
if (organizations.status === 401 || organizations.status === 403) {
  console.error("HappyScribe rejected the API key. Check HAPPYSCRIBE_API_KEY.");
  process.exit(1);
}
if (!organizations.ok) {
  console.error(
    `HappyScribe workspace check failed with status ${organizations.status}.`,
  );
  process.exit(1);
}

const organizationPayload = await organizations.json();
const organizationCount = Array.isArray(organizationPayload.organizations)
  ? organizationPayload.organizations.length
  : 0;
if (organizationCount === 0) {
  console.error("No HappyScribe workspace was found for this API key.");
  process.exit(1);
}

const upload = await fetch(
  `${baseUrl}/uploads/new?filename=${encodeURIComponent("medialingo-check.mp3")}`,
  { headers },
);
if (!upload.ok) {
  console.error(
    `HappyScribe upload URL check failed with status ${upload.status}.`,
  );
  process.exit(1);
}

const uploadPayload = await upload.json();
if (
  typeof uploadPayload.signedUrl !== "string" ||
  !uploadPayload.signedUrl.startsWith("https://")
) {
  console.error("HappyScribe returned an unexpected upload URL.");
  process.exit(1);
}

console.log(
  `HappyScribe key works for ${organizationCount} workspace(s). A signed upload URL was returned. No transcription order was created.`,
);
