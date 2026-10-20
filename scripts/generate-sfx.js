// Generate one sound effect with ElevenLabs and register it in the local manifest.
 // Usage: ELEVENLABS_API_KEY=... node scripts/generate-sfx.js --name magic --prompt "A short bright magical sparkle, cartoony, no speech"
const fs = require('node:fs/promises');
const path = require('node:path');

const key = process.env.ELEVENLABS_API_KEY;
const args = process.argv.slice(2);
function arg(name) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : ''; }
const name = arg('--name').trim().toLowerCase();
const prompt = arg('--prompt').trim();
if (!key) {
  console.error('Missing ELEVENLABS_API_KEY.');
  process.exit(1);
}
if (!/^[a-z0-9-]{2,40}$/.test(name) || !prompt) {
  console.error('Usage: node scripts/generate-sfx.js --name magic --prompt "Describe a short game sound"');
  process.exit(1);
}
async function main() {
  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({ text: prompt, duration_seconds: 2.5, prompt_influence: 0.3 })
  });
  if (!response.ok) throw new Error(`Sound generation failed (${response.status}): ${await response.text()}`);
  const dir = path.join(process.cwd(), 'public', 'sfx');
  await fs.mkdir(dir, { recursive: true });
  const file = `${name}.mp3`;
  await fs.writeFile(path.join(dir, file), new Uint8Array(await response.arrayBuffer()));
  const manifestPath = path.join(dir, 'manifest.json');
  let manifest = { version: 1, assets: {} };
  try { manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')); } catch {}
  manifest.assets ||= {};
  manifest.assets[name] = {
    file: `/sfx/${file}`,
    source: 'AI-generated with ElevenLabs',
    creator: 'Generated for LarpBattle',
    license: 'Review provider terms before distribution',
    prompt
  };
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Generated ${path.join(dir, file)} and registered it in manifest.json.`);
}
main().catch(error => { console.error(error.message); process.exit(1); });
