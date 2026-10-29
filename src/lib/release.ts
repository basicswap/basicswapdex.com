// Latest BasicSwap release, read from GitHub at build time.
//
// The site shows the release's version and the fingerprint of the key that
// signs release tags. Both are checked here before they are shown:
//
// - Every build fetches the latest release's tag object and reads the
//   issuer fingerprint out of its PGP signature. If it is not
//   SIGNING_KEY.fingerprint, the build FAILS. A tag signed by a different
//   key is exactly what a person needs to look at before the site tells
//   visitors to trust it.
// - If GitHub cannot be reached (offline dev, API outage), the build
//   continues without a version number, the same as the old site did
//   before its script ran. Nothing unverified is displayed.

export const SIGNING_KEY = {
  owner: 'tecnovert',
  // Issuer fingerprint of the v0.19.0 tag signature (2026-10-03), matching
  // key 8ED6D8750C4E3F93 on github.com/tecnovert. Confirm with the maintainer.
  fingerprint: '62C74C113CD9E31DAA65564F8ED6D8750C4E3F93',
  keyUrl: 'https://github.com/tecnovert.gpg',
};

export const REPO = 'basicswap/basicswap';
export const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;

export type Release = {
  tag: string;
  url: string;
  publishedAt: string;
};

/** "62C74C11..." → "62C7 4C11 3CD9 ..." */
export const formatFingerprint = (fpr: string) => fpr.match(/.{4}/g)!.join(' ');

async function gh(path: string) {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/${path}`, { headers, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`GitHub ${path}: HTTP ${res.status}`);
  return res.json();
}

/** Reads the v4 "issuer fingerprint" subpacket (type 33) from an armored signature. */
export function issuerFingerprint(armored: string): string | null {
  const body = armored
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('-----') && !l.includes(':') && !l.startsWith('='))
    .join('');
  const bytes = Buffer.from(body, 'base64');
  // Packet header: new or old format, signature packet (tag 2).
  let i = 0;
  const ctb = bytes[i++];
  let tag: number;
  if (ctb & 0x40) {
    tag = ctb & 0x3f;
    const l0 = bytes[i++];
    if (l0 >= 192 && l0 < 224) i++;
    else if (l0 === 255) i += 4;
  } else {
    tag = (ctb >> 2) & 0x0f;
    const lenType = ctb & 0x03;
    i += lenType === 0 ? 1 : lenType === 1 ? 2 : lenType === 2 ? 4 : 0;
  }
  if (tag !== 2) return null;
  const version = bytes[i];
  if (version !== 4) return null;
  i += 4; // version, sig type, pubkey algo, hash algo
  const hashedLen = (bytes[i] << 8) | bytes[i + 1];
  i += 2;
  const end = i + hashedLen;
  while (i < end) {
    let len = bytes[i++];
    if (len >= 192 && len < 255) len = ((len - 192) << 8) + bytes[i++] + 192;
    else if (len === 255) {
      len = bytes.readUInt32BE(i);
      i += 4;
    }
    const type = bytes[i] & 0x7f;
    if (type === 33 && bytes[i + 1] === 4) {
      return bytes.subarray(i + 2, i + 22).toString('hex').toUpperCase();
    }
    i += len;
  }
  return null;
}

let cached: Promise<Release | null> | undefined;

export function getLatestRelease(): Promise<Release | null> {
  cached ??= load();
  return cached;
}

async function load(): Promise<Release | null> {
  let release: { tag_name: string; html_url: string; published_at: string };
  let tagObject: { verification?: { signature?: string } };
  try {
    release = await gh(`repos/${REPO}/releases/latest`);
    const ref = await gh(`repos/${REPO}/git/ref/tags/${release.tag_name}`);
    if (ref.object.type !== 'tag') {
      throw new Error(`release tag ${release.tag_name} is not an annotated, signed tag`);
    }
    tagObject = await gh(`repos/${REPO}/git/tags/${ref.object.sha}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not an annotated')) throw error;
    console.warn(`[release] GitHub unreachable, building without a version: ${(error as Error).message}`);
    return null;
  }

  const signature = tagObject.verification?.signature;
  const fpr = signature ? issuerFingerprint(signature) : null;
  if (fpr !== SIGNING_KEY.fingerprint) {
    throw new Error(
      `[release] ${release.tag_name} is signed by ${fpr ?? 'nothing'}, expected ${SIGNING_KEY.fingerprint}. ` +
        'Confirm the new key with the maintainers, then update SIGNING_KEY in src/lib/release.ts.',
    );
  }

  return { tag: release.tag_name, url: release.html_url, publishedAt: release.published_at };
}
