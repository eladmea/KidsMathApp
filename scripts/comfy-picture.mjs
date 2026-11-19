// Makes a game picture with the local ComfyUI (see "Make a picture with
// ComfyUI" in ARCHITECTURE.md): fills the house prompt with the subject,
// draws it on a white page, lifts it off the page with BiRefNet (the
// comfyui-rmbg node pack), saves both in .comfy-pages/, and makes the game
// picture with scripts/picture-cutout.mjs.
//   node scripts/comfy-picture.mjs <image key> "<subject>" [options]
//   node scripts/comfy-picture.mjs kitchen/food/onion "whole brown onion"
//   --seed N         another seed when the first one doesn't read as its subject
//   --page-only      draw and save, don't put it in the game yet
// To compare settings (the defaults are the house settings below):
//   --steps N --cfg N --sampler NAME --scheduler NAME --model FILE
//   --prompt "..." --negative "..."   ({subject} is filled in)
//   --tag NAME       added to the saved file names, to keep tries apart
//   --shape FILE     start from this picture (a simple drawing of the shape)
//   --denoise N      how much of it to repaint, 0 to 1 (with --shape; default 0.7)
// ComfyUI must be running (COMFYUI_URL, default http://127.0.0.1:8188).
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const args = process.argv.slice(2);
// --page-only takes no value; every other --option takes the word after it.
const takesValue = (arg) => arg && arg.startsWith('--') && arg !== '--page-only';
const [key, subject] = args.filter((arg, i) => !arg.startsWith('--') && !takesValue(args[i - 1]));
const option = (name, fallback) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : fallback);
const SEED = Number(option('seed', 1));
const TAG = option('tag', '');
const URL_ = (process.env.COMFYUI_URL || 'http://127.0.0.1:8188').replace(/\/$/, '');
if (!key || !subject) {
  console.error('Usage: node scripts/comfy-picture.mjs <image key> "<subject>" [options]');
  process.exit(1);
}

// The house prompt (ARCHITECTURE.md). Change it there and here together.
// (word:1.4) gives a word more weight. These two prompts are everything the
// model is told: the workflow below has no other text.
const fill = (text) => text.replaceAll('{subject}', subject);
const prompt = option('prompt') ? fill(option('prompt')) : `(3D cartoon game icon:1.4) of a single ${subject}, (inanimate food object:1.3), (stylized toy:1.2), simple rounded shapes, smooth glossy flat colours, minimal texture, bright saturated colours, flat even lighting, floating, centred, (pure white background:1.3)`;
const negative = option('negative') ? fill(option('negative')) : '(face, eyes, mouth, smile, character, mascot, animal, bird:1.6), (photo, realistic, photorealistic:1.5), detailed texture, (shadow, drop shadow, cast shadow, floor, ground, reflection:1.4), text, label, letters, logo, watermark';

// The house settings.
const MODEL = option('model', 'DreamShaperXL_Turbo-Lightning.safetensors');
const STEPS = Number(option('steps', 20));
const CFG = Number(option('cfg', 7));
const SAMPLER = option('sampler', 'dpmpp_2m');
const SCHEDULER = option('scheduler', 'karras');
const SHAPE = option('shape');
const DENOISE = Number(option('denoise', SHAPE ? 0.7 : 1));

// --shape: upload the drawing, so ComfyUI can start from it.
let shapeName = null;
if (SHAPE) {
  const form = new FormData();
  form.append('image', new Blob([fs.readFileSync(SHAPE)], { type: 'image/png' }), path.basename(SHAPE));
  form.append('overwrite', 'true');
  const upload = await fetch(`${URL_}/upload/image`, { method: 'POST', body: form });
  if (!upload.ok) throw new Error(`ComfyUI refused the shape: ${upload.status} ${await upload.text()}`);
  shapeName = (await upload.json()).name;
}

const node = (title, class_type, inputs) => ({ class_type, inputs, _meta: { title } });
const workflow = {
  1: node('Load model', 'CheckpointLoaderSimple', { ckpt_name: MODEL }),
  2: node('Prompt', 'CLIPTextEncode', { clip: ['1', 1], text: prompt }),
  3: node('Negative prompt', 'CLIPTextEncode', { clip: ['1', 1], text: negative }),
  4: SHAPE ? node('Shape', 'VAEEncode', { pixels: ['10', 0], vae: ['1', 2] }) : node('Canvas size', 'EmptyLatentImage', { width: 1024, height: 1024, batch_size: 1 }),
  5: node('Draw', 'KSampler', { model: ['1', 0], positive: ['2', 0], negative: ['3', 0], latent_image: ['4', 0], seed: SEED, steps: STEPS, cfg: CFG, sampler_name: SAMPLER, scheduler: SCHEDULER, denoise: DENOISE }),
  6: node('Decode', 'VAEDecode', { samples: ['5', 0], vae: ['1', 2] }),
  7: node('Save page', 'SaveImage', { images: ['6', 0], filename_prefix: 'kidsmath/page' }),
  8: node('Remove background', 'BiRefNetRMBG', { image: ['6', 0], model: 'BiRefNet_toonout', sensitivity: 1, mask_blur: 0, mask_offset: 0, invert_output: false, refine_foreground: true, unload_model: false, background: 'Alpha' }),
  9: node('Save cutout', 'SaveImage', { images: ['8', 0], filename_prefix: 'kidsmath/cutout' }),
  ...(SHAPE ? { 10: node('Load shape', 'LoadImage', { image: shapeName }) } : {}),
};

const post = await fetch(`${URL_}/prompt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: workflow }) });
if (!post.ok) throw new Error(`ComfyUI refused the workflow: ${post.status} ${await post.text()}`);
const { prompt_id: id } = await post.json();

let outputs = null;
for (let i = 0; i < 600 && !outputs; i++) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const entry = (await (await fetch(`${URL_}/history/${id}`)).json())[id];
  if (!entry) continue;
  if (entry.status && entry.status.status_str === 'error') throw new Error(`ComfyUI failed: ${JSON.stringify(entry.status.messages)}`);
  if (entry.outputs && entry.outputs[9]) outputs = entry.outputs;
}
if (!outputs) throw new Error('ComfyUI took longer than 5 minutes');

// The page (white background) and the cutout (transparent background).
const save = async (node, file) => {
  const image = outputs[node].images[0];
  const query = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder, type: image.type });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(await (await fetch(`${URL_}/view?${query}`)).arrayBuffer()));
};
const name = `${key}${TAG ? `.${TAG}` : ''}.seed${SEED}`;
const page = path.join('.comfy-pages', `${name}.png`);
const cutout = path.join('.comfy-pages', `${name}.cut.png`);
await save(7, page);
await save(9, cutout);
console.log(`${cutout} (seed ${SEED})`);

if (!args.includes('--page-only')) {
  execFileSync(process.execPath, ['scripts/picture-cutout.mjs', cutout, key], { stdio: 'inherit' });
}
