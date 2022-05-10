import sharp from 'sharp';
import * as fs from 'fs';
import * as stream from 'stream';
import { promisify } from 'util';

const pipeline = promisify(stream.pipeline);

const resize = async () => {
  const inStream = fs.createReadStream('fakePath/to.jpg');
  const transform = sharp().resize({ width: 100, height: 100 });
  const outStream = fs.createWriteStream('fakePath/to/output.jpg');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  await pipeline(inStream, transform, outStream);
};

resize().catch((e) => console.error(e));
