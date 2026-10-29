#!/usr/bin/env node
// Fails when the docs name a basicswap-prepare or basicswap-run option, or a
// basicswap-bash command, that no longer exists, so a renamed flag shows up
// in CI instead of in a reader's terminal.
//
//   npm run check:docs
//
// Options are looked up in basicswap's bin/prepare.py and bin/run.py at the
// latest release tag, and bsx-* commands in basicswap-bash's master branch,
// both read from GitHub. If GitHub can't be reached the check warns and
// passes: it guards against drift, not against being offline.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const DOCS = 'src/content/docs';
// Flags in the docs that belong to other programs (docker, curl, apt, pip, uv).
const OTHER_TOOLS = new Set(['rm', 'request', 'header', 'data', 'digest', 'require-hashes', 'no-install-recommends', 'no-cache', 'seed', 'service-ports', 'help']);

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'basicswapdex.com docs check' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
async function get(url, json = true) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return json ? res.json() : res.text();
}

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
const uses = { flags: new Map(), commands: new Map() };
const note = (map, key, where) => map.set(key, [...(map.get(key) ?? []), where]);
for (const file of walk(DOCS).filter((f) => f.endsWith('.mdx'))) {
  const page = relative(DOCS, file);
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const [, flag] of line.matchAll(/(?:^|[\s`(])--([a-z][a-z0-9_-]*)/g)) if (!OTHER_TOOLS.has(flag)) note(uses.flags, flag, `${page}:${i + 1}`);
      for (const [cmd] of line.matchAll(/\bbsx-[a-z]+\b/g)) note(uses.commands, cmd, `${page}:${i + 1}`);
    });
}

let prepare, run, release, bashFiles;
try {
  release = (await get('https://api.github.com/repos/basicswap/basicswap/releases/latest')).tag_name;
  const raw = (path) => get(`https://raw.githubusercontent.com/basicswap/basicswap/${release}/${path}`, false);
  [prepare, run] = await Promise.all([raw('basicswap/bin/prepare.py'), raw('basicswap/bin/run.py')]);
  const tree = await get('https://api.github.com/repos/nahuhh/basicswap-bash/git/trees/master');
  bashFiles = new Set(tree.tree.map((t) => t.path));
} catch (err) {
  console.warn(`Docs commands: skipped, GitHub unreachable (${err.message}).`);
  process.exit(0);
}

// An option is known if its name appears in the scripts as a quoted string
// ("addcoin") or as a flag in their help text (--btc-mode=MODE).
const source = prepare + run;
const known = (flag) => source.includes(`"${flag}"`) || source.includes(`--${flag}`) || (flag.endsWith('-mode') && /name\.endswith\("-mode"\)/.test(prepare)) || (flag.endsWith('-electrum-server') && /name\.endswith\("-electrum-server"\)/.test(prepare));

const problems = [];
for (const [flag, where] of uses.flags) if (!known(flag)) problems.push(`--${flag} is not a basicswap-prepare or basicswap-run option at ${release} (${where.join(', ')})`);
for (const [cmd, where] of uses.commands) if (!bashFiles.has(cmd)) problems.push(`${cmd} is not a basicswap-bash command (${where.join(', ')})`);

if (problems.length) {
  console.error(`Docs commands (${problems.length}):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`Docs commands: ${uses.flags.size} options checked against basicswap ${release}, ${uses.commands.size} bsx commands against basicswap-bash.`);
