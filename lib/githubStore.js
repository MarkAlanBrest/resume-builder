const GITHUB_API = "https://api.github.com";

function githubRepo() {
  const owner =
    process.env.GITHUB_REPO_OWNER || process.env.VERCEL_GIT_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME || process.env.VERCEL_GIT_REPO_SLUG;
  if (!owner || !repo) return null;
  return { owner, repo };
}

export function hasGithubStorage() {
  return !!(process.env.VERCEL && process.env.GITHUB_TOKEN && githubRepo());
}

function dataPath(filename) {
  return `data/${filename}`;
}

async function githubRequest(relativePath, options = {}) {
  const repo = githubRepo();
  if (!repo || !process.env.GITHUB_TOKEN) return null;

  const url = `${GITHUB_API}/repos/${repo.owner}/${repo.repo}/contents/${relativePath}`;
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
  });
}

export async function readGithubJson(filename) {
  if (!hasGithubStorage()) return null;

  try {
    const response = await githubRequest(dataPath(filename));
    if (!response?.ok) return null;

    const payload = await response.json();
    const content = Buffer.from(payload.content, "base64").toString("utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function writeGithubJson(filename, data) {
  if (!hasGithubStorage()) {
    throw new Error("GitHub storage is not configured");
  }

  const json = `${JSON.stringify(data, null, 2)}\n`;
  const content = Buffer.from(json, "utf8").toString("base64");
  const path = dataPath(filename);

  const existingResponse = await githubRequest(path);
  let sha;
  if (existingResponse?.ok) {
    const existing = await existingResponse.json();
    sha = existing.sha;
  }

  const response = await githubRequest(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `Update ${filename} from admin`,
      content,
      sha,
      branch: "main",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub write failed (${response.status}): ${error}`);
  }

  return data;
}
