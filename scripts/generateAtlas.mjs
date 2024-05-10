import fs from "fs";
import { createCanvas, loadImage } from "canvas";

const TEXTURE_ROOT = "./public/images/textures";
const ATLAS_ROOT = "./public/images/atlas";
const ATLAS_WIDTH = 256;
const ATLAS_HEIGHT = 256;

(async () => {
  const canvas = createCanvas(ATLAS_WIDTH, ATLAS_HEIGHT);
  const ctx = canvas.getContext("2d");

  const json = {};
  await blitBlock(ctx, json);
  await blitEnvironment(ctx, json);
  await blitTint(ctx, json);

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(ATLAS_ROOT + "/atlas.png", buffer);
  fs.writeFileSync(ATLAS_ROOT + "/atlas.json", JSON.stringify(json));
})();

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} json
 */
async function blitBlock(ctx, json) {
  const UNIT = 16;

  const root = TEXTURE_ROOT + "/block";
  const files = fs.readdirSync(root);
  const [pngs, mcmetas] = partition(files, (file) => file.endsWith(".png"));

  const images = {};
  for (const png of pngs) {
    const image = await loadImage(root + "/" + png);
    if (image.width !== UNIT) {
      throw new Error("Unexpected aspect: " + png);
    }

    const nFrame = image.height / UNIT;
    images[png.substring(0, png.length - 4)] = { image, nFrame };
  }
  for (const mcmeta of mcmetas) {
    const { animation } = JSON.parse(fs.readFileSync(root + "/" + mcmeta));
    images[mcmeta.substring(0, mcmeta.length - 11)].animation = animation;
  }

  const data = {};

  let x = 0;
  let y = 0;

  for (const texName in images) {
    const image = images[texName];
    const offset = [];
    for (let i = 0; i < image.nFrame; i++) {
      ctx.drawImage(image.image, 0, i * UNIT, UNIT, UNIT, x, y, UNIT, UNIT);
      offset.push([x, y]);

      x += UNIT;
      if (x >= ATLAS_WIDTH) {
        x -= ATLAS_WIDTH;
        y += UNIT;
      }
    }

    data[texName] = { offset };
    if (image.animation) {
      data[texName].animation = image.animation;
    }
  }

  json.block = data;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} json
 */
async function blitEnvironment(ctx, json) {
  const DATA = ENVIRONMENT_DATA;

  const root = TEXTURE_ROOT + "/environment";

  const moon = await loadImage(root + "/moon_phases.png");
  if (moon.width !== 128 || moon.height !== 64) {
    throw new Error("Unexpected aspect: moon_phases.png");
  }
  for (let i = 0; i < 8; i++) {
    const {
      offset: [x, y],
    } = DATA[`moon_${i}`];
    ctx.drawImage(moon, (i % 4) * 32, i < 4 ? 0 : 32, 32, 32, x, y, 32, 32);
  }

  const sun = await loadImage(root + "/sun.png");
  if (sun.width !== 32 || sun.height !== 32) {
    throw new Error("Unexpected aspect: sun.png");
  }
  const {
    offset: [x, y],
  } = DATA.sun;
  ctx.drawImage(sun, 0, 0, 32, 32, x, y, 32, 32);

  json.environment = DATA;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} json
 */
async function blitTint(ctx, json) {
  const DATA = TINT_DATA;

  const tint = await loadImage(TEXTURE_ROOT + "/tint/tint.png");
  if (tint.width !== 16 || tint.height !== 16) {
    throw new Error("Unexpected aspect: tint.png");
  }
  const {
    offset: [x, y],
  } = DATA;
  ctx.drawImage(tint, 0, 0, 16, 16, x, y, 16, 16);

  json.tint = DATA;
}

/**
 * @template T
 * @param {T[]} arr
 * @param {(ele: T) => boolean} condition
 * @returns {[T[], T[]]}
 */
function partition(arr, condition) {
  const passed = [],
    other = [];
  for (const element of arr) {
    if (condition(element)) {
      passed.push(element);
    } else {
      other.push(element);
    }
  }
  return [passed, other];
}

const ENVIRONMENT_LEFT = 0;
const ENVIRONMENT_TOP = ATLAS_HEIGHT - 64;
const ENVIRONMENT_DATA = {
  moon_0: {
    offset: [ENVIRONMENT_LEFT, ENVIRONMENT_TOP],
  },
  moon_1: {
    offset: [ENVIRONMENT_LEFT + 32, ENVIRONMENT_TOP],
  },
  moon_2: {
    offset: [ENVIRONMENT_LEFT + 64, ENVIRONMENT_TOP],
  },
  moon_3: {
    offset: [ENVIRONMENT_LEFT + 96, ENVIRONMENT_TOP],
  },
  moon_4: {
    offset: [ENVIRONMENT_LEFT + 128, ENVIRONMENT_TOP],
  },
  moon_5: {
    offset: [ENVIRONMENT_LEFT + 160, ENVIRONMENT_TOP],
  },
  moon_6: {
    offset: [ENVIRONMENT_LEFT + 192, ENVIRONMENT_TOP],
  },
  moon_7: {
    offset: [ENVIRONMENT_LEFT + 224, ENVIRONMENT_TOP],
  },
  sun: {
    offset: [ENVIRONMENT_LEFT, ENVIRONMENT_TOP + 32],
  },
};

const TINT_LEFT = ATLAS_WIDTH - 16;
const TINT_TOP = ATLAS_HEIGHT - 16;
const TINT_DATA = {
  offset: [TINT_LEFT, TINT_TOP],
};
