// Download CC0-only game UI sound effects from Freesound.
 // Usage: FREESOUND_API_KEY=... npm run sfx:fetch
const fs = require('node:fs/promises');
const path = require('node:path');

const token = process.env.FREESOUND_API_KEY;
if (!token) {
  console.error('Missing FREESOUND_API_KEY. Create a Freesound API key and set it in your environment.');
  process.exit(1);
}
const outDir = path.join(process.cwd(), 'public', 'sfx');
const manifestPath = path.join(outDir, 'manifest.json');
const categories = [
  { key: 'ui-click', query: 'game interface button click short' },
  { key: 'ui-confirm', query: 'interface confirm notification chime short' },
  { key: 'magic', query: 'magical sparkle fantasy whoosh short' },
  { key: 'impact-soft', query: 'soft cartoon impact pop short' }
];
const manifest = { version: 1, assets: {} };

async function api(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Freesound API returned ${response.status}: ${await response.text()}`);
  return response.json();
}
async function main() {
  await fs.mkdir(outDir, { recursive: true });
  for (const category of categories) {
    const search = new URL('https://freesound.org/apiv2/search/text/');
    search.searchParams.set('query', category.query);
    search.searchParams.set('filter', 'license:"Creative Commons 0"');
    search.searchParams.set('fields', 'id,name,license,previews,username,url,description');
    search.searchParams.set('page_size', '10');
    search.searchParams.set('token', token);
    const results = await api(search);
    const sound = (results.results || []).find(item =>
      item.license === 'Creative Commons 0' && item.previews && item.previews['preview-hq-mp3']
    );
    if (!sound) {
      console.warn(`No CC0 MP3 preview found for ${category.key}; skipping.`);
      continue;
    }
    const file = `${category.key}.mp3`;
    const audioResponse = await fetch(sound.previews['preview-hq-mp3']);
    if (!audioResponse.ok) {
      console.warn(`Could not download ${sound.name}; skipping.`);
      continue;
    }
    await fs.writeFile(path.join(outDir, file), new Uint8Array(await audioResponse.arrayBuffer()));
    manifest.assets[category.key] = {
      file: `/sfx/${file}`,
      source: 'Freesound',
      sourceUrl: sound.url,
      soundId: sound.id,
      title: sound.name,
      creator: sound.username,
      license: 'CC0 1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/'
    };
    console.log(`Downloaded ${category.key}: ${sound.name} (CC0)`);
  }
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Wrote ${manifestPath}. Review the sounds in-game before release.`);
}
main().catch(error => { console.error(error.message); process.exit(1); });
