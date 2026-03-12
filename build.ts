/** @format */

import path from "node:path";
import { promises as fs, Dirent } from "node:fs";

// ── Configuration ─────────────────────────────────────────────────────────────

/** The public URL of the deployed site — used for Surge import deep links */
const SITE_URL = (process.env.SITE_URL ?? "https://ruleset.rss.ovh").replace(/\/$/, "");

const ROOT_DIR   = process.cwd();
const OUTPUT_DIR = path.join(ROOT_DIR, "public");
const RAW_DIR    = path.join(ROOT_DIR, "Artifacts");
const SRC_DIR    = path.join(ROOT_DIR, "src");

const SURGE_ICON_URL =
    "https://raw.githubusercontent.com/xream/scripts/refs/heads/main/scriptable/surge/surge-transparent.png";

/** Only files with these extensions are listed in the HTML */
const ALLOWED_EXTENSIONS = [".sgmodule", ".list", ".txt", ".conf"];

/** Files ending with these extensions get a Surge one-click import button */
const MODULE_EXTENSIONS = [".sgmodule"];

/** Only directories with these names are descended into */
const ALLOWED_DIRECTORIES = ["Clash", "Surge", "Beta", "Snippet", "External", "Domainset", "Classic"];

// ── Icons ─────────────────────────────────────────────────────────────────────

const FOLDER_SVG = `<svg class="folder-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path d="M64 480H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H288c-10.1 0-19.6-4.7-25.6-12.8L243.2 57.6C231.1 41.5 212.1 32 192 32H64C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64z"/></svg>`;
const FILE_SVG = `<svg class="file-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor"><path d="M0 64C0 28.7 28.7 0 64 0H224V128c0 17.7 14.3 32 32 32H384V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zm384 64H256V0L384 128z"/></svg>`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const prioritySorter = (a: Dirent, b: Dirent): number => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    if (a.isDirectory() && b.isDirectory()) {
        if (a.name === "Official") return -1;
        if (b.name === "Official") return 1;
    }
    return a.name.localeCompare(b.name);
};

/** Recursively copy a directory tree */
async function copyDir(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    await Promise.all(
        entries.map(async (entry) => {
            const srcPath  = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
                await copyDir(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        })
    );
}

// ── Tree builder ──────────────────────────────────────────────────────────────

/**
 * Recursively walk `dir` and build an HTML fragment.
 * `relPath` accumulates the relative path from Artifacts root, e.g. "External" or "External/Clash".
 */
async function walk(dir: string, relPath: string): Promise<string> {
    let tree = "";
    const entries = await fs.readdir(dir, { withFileTypes: true });
    entries.sort(prioritySorter);

    for (const entry of entries) {
        const childRel  = relPath ? `${relPath}/${entry.name}` : entry.name;
        const childFull = path.join(dir, entry.name);

        if (entry.isDirectory() && ALLOWED_DIRECTORIES.includes(entry.name)) {
            const children = await walk(childFull, childRel);
            tree += `
            <li class="folder">
                <div class="folder-header">
                    <span class="folder-icon">▾</span>
                    <span class="folder-icon-wrapper">${FOLDER_SVG}</span>
                    <span>${entry.name}</span>
                </div>
                <ul>${children}</ul>
            </li>`;
        } else if (ALLOWED_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
            // Relative URL from the index.html (e.g. ./External/adobe.conf)
            const relUrl = `./${childRel}`;
            // Absolute URL used for deep-link buttons (e.g. Surge import)
            const absUrl = `${SITE_URL}/${childRel}`;

            const surgeButton = MODULE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))
                ? `<a class="surge-link"
                       href="surge:///install-module?url=${encodeURIComponent(absUrl)}"
                       target="_blank"
                       title="Import into Surge (remote module)">
                       <img class="surge-icon" src="${SURGE_ICON_URL}" alt="Import to Surge" />
                   </a>`
                : "";

            tree += `
            <li class="file-item">
                <span class="file-icon-wrapper" data-url="${relUrl}" title="Copy URL" aria-label="Copy URL for ${entry.name}" role="button" tabindex="0">
                    ${FILE_SVG}
                </span>
                <a class="file-name" href="${relUrl}" target="_blank">${entry.name}</a>
                ${surgeButton}
            </li>`;
        }
    }

    return tree;
}

// ── HTML template ─────────────────────────────────────────────────────────────

function generateHtml(tree: string, css: string, js: string): string {
    const buildTime = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#fafafa" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#0d0d0f" media="(prefers-color-scheme: dark)">
    <title>Cysime's Ruleset EXtended</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
${css}
    </style>
</head>
<body>
    <main class="container">
        <header class="site-header">
            <h1>Cysime's Ruleset EXtended</h1>
            <p>
                Made by <a href="https://cysi.me">Cysime</a> &nbsp;|&nbsp;
                <a href="https://github.com/Cysime/RulesetEX/">Source @ GitHub</a> &nbsp;|&nbsp;
                Fork <a href="https://github.com/QingRex/LoonKissSurge">QingRex</a>
            </p>
            <p>Last Build: ${buildTime}</p>
        </header>

        <div class="search-wrap">
            <input type="text" id="search" placeholder="Search files and folders…" aria-label="Search files and folders" autocomplete="off" spellcheck="false">
        </div>

        <div class="hints" aria-label="Usage tips">
            <img src="${SURGE_ICON_URL}" alt="Surge" width="16" height="16" />
            Click the Surge icon to import a module directly into Surge
        </div>

        <ul class="directory-list" role="tree" aria-label="File tree">
            ${tree}
        </ul>
    </main>

    <script>
${js}
    </script>
</body>
</html>`;
}

// ── Build ─────────────────────────────────────────────────────────────────────

async function build(): Promise<void> {
    console.log("🔨 Building…");

    // 1. Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // 2. Read source CSS and JS (fail fast if missing)
    const [css, js] = await Promise.all([
        fs.readFile(path.join(SRC_DIR, "style.css"), "utf8"),
        fs.readFile(path.join(SRC_DIR, "app.js"), "utf8"),
    ]);

    // 3. Copy all Artifacts → public/ preserving folder structure
    console.log("📁 Copying Artifacts → public/…");
    await copyDir(RAW_DIR, OUTPUT_DIR);

    // 4. Walk Artifacts to build the file-tree HTML fragment
    const tree = await walk(RAW_DIR, "");

    // 5. Generate and write index.html (written last so it always wins)
    const html = generateHtml(tree, css, js);
    await fs.writeFile(path.join(OUTPUT_DIR, "index.html"), html, "utf8");

    console.log("✅ Build complete →", OUTPUT_DIR);
}

build().catch((err) => {
    console.error("❌ Build failed:", err);
    process.exit(1);
});
