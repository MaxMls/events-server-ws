const { createReadStream } = require('fs');

const name = __filename;
const start = 0;

const readStream = createReadStream(name, {
  start,
  highWaterMark: 1,
  //encoding: 'binary',
});

(async () => {
  for await (const chunk of readStream.iterator()) {
    console.log(chunk instanceof Uint8Array);
  }
})();
