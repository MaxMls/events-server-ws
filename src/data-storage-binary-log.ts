import { createReadStream, createWriteStream, write } from 'fs';
import { stat } from 'fs/promises';

const ESCAPE_CODE = '\\'.charCodeAt(0);
const N_CODE = 'n'.charCodeAt(0);
const NEW_LINE_CHUNK = new Uint8Array([ESCAPE_CODE, N_CODE]);
const ESCAPED_CHUNK = new Uint8Array([ESCAPE_CODE, N_CODE]);

export const storedArrayBinaryLog = async (name: string) => {
  const stats = await stat(name).catch(() => ({ size: 0 }));
  const queueWriting: ArrayBuffer[] = [];
  const writeStream = createWriteStream(name, {
    flags: 'a',
  });

  const findCountOfRows = async () => {
    let left = 0;
    let right = stats.size;
    const res = {
      rowIndex: -1,
    };

    while (left < right) {
      const start = left + Math.floor((right - left) / 2);

      const readStream = createReadStream(name, {
        start,
        highWaterMark: 1,
      });

      const skipEscapes = (byte: number) => {
        if (byte !== ESCAPE_CODE) {
          step.ref = findStart;
          return findStart(byte);
        }
        return false;
      };

      const findStart = (byte: number) => {
        if (byte === ESCAPE_CODE) {
          step.ref = escapedByte;
          return false;
        }
        return false;
      };

      const escapedByte = (byte: number) => {
        if (byte === N_CODE) {
          step.ref = readRowIndex;
          return false;
        }
        step.ref = findStart;
        return false;
      };

      const rowIndexArray: number[] = [];
      const readRowIndex = (letter: number) => {
        if (rowIndexArray.length === 4) {
          const rowIndex = new Uint32Array(
            new Uint8Array(rowIndexArray).buffer
          ).at(0) as number;

          left = start + 1;
          res.rowIndex = rowIndex;
          return true;
        }
        rowIndexArray.push(letter);
        return false;
      };

      const step = { ref: skipEscapes };

      for await (const buffer of readStream.iterator() as AsyncIterableIterator<Buffer>) {
        if (step.ref(buffer.at(0) as number)) {
          break;
        }
      }

      if (!rowIndexArray.length) {
        // left half
        right = start;
        continue;
      }
      break;
    }

    return res.rowIndex + 1;
  };

  let countOfRows = stats.size ? await findCountOfRows() : 0;
  console.log({ countOfRows });

  return {
    get length(): number {
      return countOfRows;
    },
    async at(index: number) {
      let left = 0;
      let right = stats.size;

      while (left < right) {
        const start = left + Math.floor((right - left) / 2);

        const readStream = createReadStream(name, {
          start,
          highWaterMark: 1,
        });

        const skipEscapes = (byte: number) => {
          if (byte !== ESCAPE_CODE) {
            step.ref = findStart;
            return findStart(byte);
          }
          return false;
        };

        const findStart = (byte: number) => {
          if (byte === ESCAPE_CODE) {
            step.ref = escapedByte;
            return false;
          }
          return false;
        };

        const escapedByte = (byte: number) => {
          if (byte === N_CODE) {
            step.ref = readRowIndex;
            return false;
          }
          step.ref = findStart;
          return false;
        };

        const rowIndexArray: number[] = [];
        const readRowIndex = (letter: number) => {
          if (rowIndexArray.length === Uint32Array.BYTES_PER_ELEMENT) {
            const rowIndex = new Uint32Array(
              new Uint8Array(rowIndexArray).buffer
            ).at(0) as number;

            if (rowIndex < index) {
              // right half
              left = start + 1;
              return true;
            }
            if (rowIndex > index) {
              // left half
              right = start;
              return true;
            }

            step.done = true;
            return true;
          }
          rowIndexArray.push(letter);
          return false;
        };

        const step = { ref: skipEscapes, offset: 0, done: false };

        for await (const buffer of readStream.iterator() as AsyncIterableIterator<Buffer>) {
          step.offset++;
          if (step.ref(buffer.at(0) as number)) {
            break;
          }
        }

        if (!rowIndexArray.length) {
          // left half
          right = start;
          continue;
        }

        if (step.done) {
          return createReadStream(name, {
            start: start + step.offset - rowIndexArray.length,
          });
        }
      }

      throw new Error('not found 2');
    },
    push(data: ArrayBuffer) {
      queueWriting.push(data);

      if (queueWriting.length > 1) {
        return;
      }

      while (queueWriting.length) {
        const queuedData = new Uint8Array(queueWriting[0]);

        writeStream.write(NEW_LINE_CHUNK);
        stats.size += NEW_LINE_CHUNK.byteLength;

        const rowIndexChunk = new Uint8Array(
          new Uint32Array([countOfRows]).buffer
        );
        writeStream.write(rowIndexChunk);
        stats.size += rowIndexChunk.byteLength;

        for (let index = 0; index < queuedData.length; index++) {
          if (queuedData.at(index) === ESCAPE_CODE) {
            writeStream.write(ESCAPED_CHUNK);
            stats.size += ESCAPED_CHUNK.byteLength;
          } else {
            const slice = queuedData.slice(index, index + 1);
            writeStream.write(slice);
            stats.size += slice.byteLength;
          }
        }

        countOfRows += 1;
        queueWriting.shift();
      }
    },
  };
};
