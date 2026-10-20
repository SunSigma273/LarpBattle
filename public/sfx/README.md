# LarpBattle sound effects

Sound files are downloaded/generated into this folder by the scripts in `scripts/`.
The binary files are intentionally not committed by default; run a script locally or in CI after adding the required API secret.

## Download CC0 sounds
1. Create a Freesound API key at https://freesound.org/apiv2/apply.
2. Set `FREESOUND_API_KEY` in your shell or CI secrets (never put it in browser code or commit it).
3. Run `npm run sfx:fetch`.

The downloader filters for the exact Freesound license label `Creative Commons 0`, then records the source URL, creator, and license in `manifest.json`. Preview downloads are intended for evaluation; confirm the sound and current license metadata before shipping. Missing categories fall back to synthesized browser sounds.

## Generate a custom effect
Set `ELEVENLABS_API_KEY` in your environment and run:
`node scripts/generate-sfx.js --name magic --prompt "A short bright magical sparkle, cartoony, no speech"`

This calls a paid/credit-based external service when applicable. Check the provider's current pricing and terms before use. Never expose the key in frontend code.

## Legal and release checklist
- Keep `manifest.json` with shipped sound files.
- Check each asset's source and license before publishing.
- Do not redistribute stock sound files as a standalone sound pack.
- AI output is labelled in the manifest; review provider terms and the generated audio before shipping.
