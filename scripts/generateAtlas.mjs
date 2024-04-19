import fs from "fs";
import Jimp from "jimp";

const imagesFolder = "./public/static/images/textures/";
const files = fs.readdirSync(imagesFolder);

const IMAGE_SIZE = 16;
const ATLAS_WIDTH = (2 ** Math.ceil(Math.log2(Math.sqrt(files.length))));
const ATLAS_HEIGHT = (2 ** Math.ceil(Math.log2(files.length / ATLAS_WIDTH)));

const width = IMAGE_SIZE * ATLAS_WIDTH;
const height = IMAGE_SIZE * ATLAS_HEIGHT;

const json = {};
json.factor = [1 / ATLAS_WIDTH, 1 / ATLAS_HEIGHT];
json.offsets = {};

new Jimp(width, height, async (err, result) => {
  for (let y = 0, i = 0; y < ATLAS_HEIGHT && i < files.length; y++) {
    for (let x = 0; x < ATLAS_WIDTH && i < files.length; x++, i++) {
      const image = await Jimp.read(imagesFolder + files[i]);
      result.blit(image, IMAGE_SIZE * x, IMAGE_SIZE * y)
        .write("./public/static/images/atlas/file.png");
      
      json.offsets[files[i].substring(0, files[i].length - 4)] = 
        [json.factor[0] * x, json.factor[1] * y];
    }
  }
  fs.writeFileSync("./public/static/images/atlas/map.json", JSON.stringify(json, null, 2));
});

