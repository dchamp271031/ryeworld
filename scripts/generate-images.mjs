/**
 * RYEWORLD Image Generation Script
 * Uses Google Gemini 2.5 Flash Image (Nano Banana) for image generation
 * Run: node scripts/generate-images.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = join(__dirname, '../public/images');
const GEMINI_API_KEY = 'AIzaSyAipJzWjvtMjMY1P_ZD9_Vq-uKyjE5SyIQ';
const MODEL = 'gemini-2.5-flash-image';

mkdirSync(IMAGES_DIR, { recursive: true });

async function generateImage(prompt, filename) {
  console.log(`\nGenerating: ${filename}`);
  console.log(`Prompt: ${prompt.slice(0, 80)}...`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE']
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];

  const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
  if (!imagePart) {
    const textPart = parts.find(p => p.text);
    throw new Error(`No image in response. Text: ${textPart?.text ?? JSON.stringify(data).slice(0, 200)}`);
  }

  const imageData = Buffer.from(imagePart.inlineData.data, 'base64');
  const filepath = join(IMAGES_DIR, filename);
  writeFileSync(filepath, imageData);
  console.log(`  Saved: ${filepath} (${(imageData.length / 1024).toFixed(0)}KB)`);
  return filepath;
}

const images = [
  {
    filename: 'the-snackery-closes-purchase-street.jpg',
    prompt: `Editorial photograph of a closed small-town bakery storefront on a quaint American main street in Rye, New York. Brown kraft paper taped inside the glass storefront window. Faint painted sign outline remains on warm red brick facade. Quiet winter morning, empty sidewalk, soft golden light from the side. The mood is melancholic and documentary. 35mm lens, slight film grain, warm slightly desaturated tones. No text or legible signage. Editorial magazine quality, feels like a real photograph.`
  },
  {
    filename: 'garnets-hockey-state-semis.jpg',
    prompt: `Action sports photograph of a high school ice hockey game. A goalie in deep red and white jersey makes a dramatic save, crouching low with the puck deflecting off the pads in a spray of ice shavings. The arena ice is bright white, the crowd in background is blurred. Players in full equipment crowd the crease. Dynamic motion, high shutter speed freeze, sharp on the players. Deep red Garnets-style jerseys. Editorial sports photography, natural arena lighting, no vignette. Feels like a real game moment captured by a photojournalist.`
  },
  {
    filename: 'rye-school-board-election-may-2026.jpg',
    prompt: `Architectural photograph of a classic American public school building in a small Northeastern suburban town. Red brick facade with white trim, tall windows, American flag on a flagpole in front. Mature oak trees frame the building. Clean overcast or soft morning light. Wide establishing shot showing the full front of the school and its entrance steps. Spring atmosphere with green grass. Civic and dignified. Documentary photography style, warm neutral tones, slight film quality. No people visible.`
  },
  {
    filename: 'garnets-lax-season-preview.jpg',
    prompt: `Action sports photograph of high school lacrosse players during a real game. A player in a deep red and white jersey sprints with the ball cradled in a lacrosse stick, two defenders in white helmets closing in. Shot on a real green grass field on a bright spring afternoon. Eye level or slightly below, telephoto compression. Background is soft blurred green grass and bleachers. Helmets, full pads, lacrosse sticks in motion. Dynamic real game energy. No text or logos. Editorial sports photography quality, natural light.`
  },
  {
    filename: 'coffee-shops-ranked.jpg',
    prompt: `Close-up editorial photograph of a perfectly pulled cortado in a small white ceramic cup sitting on a smooth marble counter inside a warmly lit neighborhood cafe. The espresso has beautiful caramel crema on top. Soft natural window light from the left. The background is soft focus showing wooden cafe shelving and a La Marzocco espresso machine blurred. Warm golden tones, no cool filters. Calm morning atmosphere. 50mm macro-style lens, shallow depth of field, no artificial lighting, real cafe feel. Editorial food photography quality.`
  },
  {
    filename: 'rye-fire-truck-1-47m-pierce-pumper.jpg',
    prompt: `Editorial photograph of a brand new gleaming red Pierce pumper fire engine parked in front of a small-town American fire station with classic brick architecture. The truck is deep red with polished chrome fittings, hose reels and equipment visible along the side. Fire station bay doors open behind it. Late afternoon warm golden light. Wide shot showing the full length of the truck and the station facade. Civic and proud atmosphere. Documentary photojournalism style, warm tones, no heavy processing. Feels like a real local news photograph.`
  }
];

let successCount = 0;
for (const { filename, prompt } of images) {
  try {
    await generateImage(prompt, filename);
    successCount++;
    // Delay between requests to respect rate limits
    await new Promise(r => setTimeout(r, 2000));
  } catch (err) {
    console.error(`  ERROR generating ${filename}: ${err.message}`);
  }
}

console.log(`\nDone. ${successCount}/${images.length} images generated.`);
