import fs from "fs";
import Jimp from "jimp";

const ROOT = "./public/static/images/textures/";
const UNIT = 16;

(async () => {
  const files = fs.readdirSync(ROOT);
  const [pngs, mcmetas] = partition(files, (file) => file.endsWith(".png"));
  
  const images = { occupied: 0, data: {} };

  for (const png of pngs) {
    const image = await Jimp.read(ROOT + png);
    if (image.getWidth() !== UNIT) {
      throw new Error("Unexpected behavior: Image width is not " + UNIT);
    }

    const height = image.getHeight() / UNIT;
    images.occupied += height;
    images.data[png.substring(0, png.length - 4)] = { image, height };
  }

  for (const mcmeta of mcmetas) {
    const { animation } = JSON.parse(fs.readFileSync(ROOT + mcmeta));
    images.data[mcmeta.substring(0, mcmeta.length - 11)].animation = animation;
  }
  
  const ATLAS_SIZE = (2 ** Math.ceil(Math.log2(Math.sqrt(images.occupied))));
  
  const json = {};
  json.factor = [1 / ATLAS_SIZE, 1 / ATLAS_SIZE];
  json.data = {};

  new Jimp(UNIT * ATLAS_SIZE, UNIT * ATLAS_SIZE, async (_err, result) => {
    let x = 0, y = 0;

    for (const texName in images.data) {
      const data = images.data[texName];
      const offset = [];
      for (let i = 0; i < data.height; i++) {
        result.blit(data.image, x * UNIT, y * UNIT, 0, i * UNIT, UNIT, UNIT);
        offset.push([x * UNIT, y * UNIT]);

        x += 1;
        if (x >= ATLAS_SIZE) {
          x -= ATLAS_SIZE;
          y += 1;
        }
      }

      json.data[texName] = { offset };
      if (data.animation) {
        json.data[texName].animation = data.animation;
      }
    }
  
    result.write("./public/static/images/atlas/atlas.png");
    fs.writeFileSync("./public/static/images/atlas/texture.json", JSON.stringify(json, null, 2));
  });
})();



/**
 * @template T
 * @param {T[]} arr 
 * @param {(ele: T) => boolean} condition 
 * @returns {[T[], T[]]}
 */
function partition(arr, condition) {
  const passed = [], other = [];
  for (const element of arr) {
    if (condition(element)) {
      passed.push(element);
    }
    else {
      other.push(element);
    }
  }
  return [passed, other];
}