import fs from "fs";
import Jimp from "jimp";

const TEXTURE_ROOT = "./public/images/textures";
const ATLAS_ROOT = "./public/images/atlas";
const ATLAS_WIDTH = 256;
const ATLAS_HEIGHT = 256;

new Jimp(ATLAS_WIDTH, ATLAS_HEIGHT, async (error, atlas) => {
  if (error) throw error;

  const json = {};
  await blitBlock(atlas, json);
  await blitEnvironment(atlas, json);
  await blitTint(atlas, json);

  atlas.write(ATLAS_ROOT + "/atlas.png");
  fs.writeFileSync(ATLAS_ROOT + "/atlas.json", JSON.stringify(json));
});

/**
 * @param {Jimp} atlas
 * @param {object} json
 */
async function blitBlock(atlas, json) {
  const UNIT = 16;

  const root = TEXTURE_ROOT + "/block";
  const files = fs.readdirSync(root);
  const [pngs, mcmetas] = partition(files, (file) => file.endsWith(".png"));

  const images = {};
  for (const png of pngs) {
    const image = await Jimp.read(root + "/" + png);
    if (image.getWidth() !== UNIT) {
      throw new Error("Unexpected aspect: " + png);
    }

    const nFrame = image.getHeight() / UNIT;
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
      atlas.blit(image.image, x, y, 0, i * UNIT, UNIT, UNIT);
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
 * @param {Jimp} atlas
 * @param {object} json
 */
async function blitEnvironment(atlas, json) {
  const LEFT = ENVIRONMENT_LEFT;
  const TOP = ENVIRONMENT_TOP;
  const DATA = ENVIRONMENT_DATA;

  const root = TEXTURE_ROOT + "/environment";

  const moon = await Jimp.read(root + "/moon_phases.png");
  if (moon.getWidth() !== 128 || moon.getHeight() !== 64) {
    throw new Error("Unexpected aspect: moon_phases.png");
  }
  for (let i = 0; i < 8; i++) {
    const {
      offset: [x, y],
    } = DATA[`moon_${i}`];
    atlas.blit(moon, x, y, x - LEFT, y - TOP, 32, 32);
  }

  const sun = await Jimp.read(root + "/sun.png");
  if (sun.getWidth() !== 32 || sun.getHeight() !== 32) {
    throw new Error("Unexpected aspect: sun.png");
  }
  const {
    offset: [x, y],
  } = DATA.sun;
  atlas.blit(sun, x, y, 0, 0, 32, 32);

  json.environment = DATA;
}

/**
 * @param {Jimp} atlas
 * @param {object} json
 */
async function blitTint(atlas, json) {
  const DATA = TINT_DATA;

  const tint = await Jimp.read(TEXTURE_ROOT + "/tint/tint.png");
  if (tint.getWidth() !== 16 || tint.getHeight() !== 16) {
    throw new Error("Unexpected aspect: tint.png");
  }
  const {
    offset: [x, y],
  } = DATA;
  atlas.blit(tint, x, y, 0, 0, 16, 16);

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
