import {
  ReadStream,
  createReadStream,
  createWriteStream,
  fstat,
  write,
} from 'fs';
import { stat } from 'fs/promises';

export const ESCAPE_CODE = '\\'.charCodeAt(0);
export const N_CODE = 'n'.charCodeAt(0);
const NEW_LINE_CHUNK = new Uint8Array([ESCAPE_CODE, N_CODE]);
const ESCAPED_CHUNK = new Uint8Array([ESCAPE_CODE, ESCAPE_CODE]);
const INDEX_TYPE = Uint32Array;

// meta info is 6 (or 6+ because of escaped) bytes per row: NEW_LINE_CHUNK + INDEX

export const readLine = async (
  readStream: ReadStream,
  callback: (index: number, data: number[]) => void
) => {
  const escapedByte = callback => (byte: number) => {
    if (byte === N_CODE) {
      step.ref = readRowIndex;
      return flushRowData();
    }
    if (byte === ESCAPE_CODE) {
      step.ref = callback;
      return callback(ESCAPE_CODE, true);
    }
    throw new Error('not valid escaped byte');
  };

  // new line always starts from escaped n
  const readNewLine = (byte: number, escaped = false) => {
    if (!escaped && byte === ESCAPE_CODE) {
      step.ref = escapedByte(readNewLine);
      return false;
    }
    throw new Error('not valid newline byte');
  };

  const rowIndexArray: number[] = [];
  const readRowIndex = (byte: number, escaped = false) => {
    if (!escaped && byte === ESCAPE_CODE) {
      step.ref = escapedByte(readRowIndex);
      return false;
    }

    rowIndexArray.push(byte);
    if (rowIndexArray.length === 4) {
      const rowIndex = new INDEX_TYPE(new Uint8Array(rowIndexArray).buffer)[0];
      step.rowIndex = rowIndex;

      rowIndexArray.length = 0;
      step.ref = readRowData;
      return false;
    }
    return false;
  };

  const data: number[] = [];
  const readRowData = (byte: number, escaped = false) => {
    if (!escaped && byte === ESCAPE_CODE) {
      step.ref = escapedByte(readRowData);
      return false;
    }

    data.push(byte);
    return false;
  };

  const flushRowData = () => {
    const isCanceled = callback(step.rowIndex, data);

    data.length = 0;
    return isCanceled;
  };

  const step = { ref: readNewLine, rowIndex: 0 };
  loop: for await (const buffer of readStream.iterator() as AsyncIterableIterator<Buffer>) {
    for (const byte of buffer) {
      if (step.ref(byte)) {
        break loop;
      }
    }
  }

  if (data.length) {
    flushRowData();
  }
};

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
        highWaterMark: 64,
      });

      const skipEscapes = (byte: number) => {
        if (byte !== ESCAPE_CODE) {
          step.ref = findStart;
          return findStart(byte);
        }
        return false;
      };

      const findStart = (byte: number, escaped = false) => {
        if (!escaped && byte === ESCAPE_CODE) {
          step.ref = escapedByte(findStart);
          return false;
        }
        return false;
      };

      const escapedByte = callback => (byte: number) => {
        if (byte === N_CODE) {
          step.ref = readRowIndex;
          return false;
        }
        if (byte === ESCAPE_CODE) {
          step.ref = callback;
          return callback(ESCAPE_CODE, true);
        }
        throw new Error('Here can be only escape or n');
      };

      const rowIndexArray: number[] = [];
      const readRowIndex = (byte: number, escaped = false) => {
        if (!escaped && byte === ESCAPE_CODE) {
          step.ref = escapedByte(readRowIndex);
          return false;
        }

        rowIndexArray.push(byte);
        if (rowIndexArray.length === 4) {
          const rowIndex = new INDEX_TYPE(
            new Uint8Array(rowIndexArray).buffer
          ).at(0) as number;

          left = start + 1;
          res.rowIndex = rowIndex;
          return true;
        }
        return false;
      };

      const step = { ref: skipEscapes };

      loop: for await (const buffer of readStream.iterator() as AsyncIterableIterator<Buffer>) {
        for (const byte of buffer) {
          if (step.ref(byte)) {
            break loop;
          }
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

  const at = async (index: number) => {
    let left = 0;
    let right = stats.size;

    while (left < right) {
      const start = left + Math.floor((right - left) / 2);

      const escapedByte = callback => (byte: number) => {
        if (byte === N_CODE) {
          step.rowOffset = step.offset - NEW_LINE_CHUNK.byteLength;
          step.ref = readRowIndex;
          return false;
        }
        if (byte === ESCAPE_CODE) {
          step.ref = callback;
          return callback(ESCAPE_CODE, true);
        }
        throw new Error('Here can be only escape or n');
      };

      const skipEscapes = (byte: number) => {
        if (byte !== ESCAPE_CODE) {
          step.ref = findStart;
          return findStart(byte);
        }
        return false;
      };

      const findStart = (byte: number, escaped = false) => {
        if (!escaped && byte === ESCAPE_CODE) {
          step.ref = escapedByte(findStart);
          return false;
        }
        return false;
      };

      const rowIndexArray: number[] = [];
      const readRowIndex = (byte: number, escaped = false) => {
        if (!escaped && byte === ESCAPE_CODE) {
          step.ref = escapedByte(readRowIndex);
          return false;
        }

        rowIndexArray.push(byte);
        if (rowIndexArray.length === INDEX_TYPE.BYTES_PER_ELEMENT) {
          const rowIndex = new INDEX_TYPE(
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
        return false;
      };

      const readStream = createReadStream(name, {
        start,
        highWaterMark: 64,
      });

      const step = {
        ref: start === 0 ? findStart : skipEscapes,
        offset: 0,
        done: false,
        rowOffset: 0,
      };

      loop: for await (const buffer of readStream.iterator() as AsyncIterableIterator<Buffer>) {
        for (const byte of buffer) {
          step.offset++;
          if (step.ref(byte)) {
            break loop;
          }
        }
      }

      if (!rowIndexArray.length) {
        // left half
        right = start;
        continue;
      }

      if (step.done) {
        // [previous DATA]{cursor is here}[\][n][INDEX][DATA]
        return createReadStream(name, {
          start: start + step.rowOffset,
        });
      }
    }

    throw new Error('not found 2');
  };

  const push = (data: ArrayBuffer) => {
    queueWriting.push(data);

    if (queueWriting.length > 1) {
      return;
    }

    while (queueWriting.length) {
      const queuedData = new Uint8Array(queueWriting[0]);

      writeStream.write(NEW_LINE_CHUNK);
      stats.size += NEW_LINE_CHUNK.byteLength;

      const rowIndexChunk = new Uint8Array(
        new INDEX_TYPE([countOfRows]).buffer
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
  };

  return {
    get length(): number {
      return countOfRows;
    },
    at,
    push,
  };
};
