import { createReadStream, createWriteStream } from 'fs';
import { stat, writeFile } from 'fs/promises';
// todo: compare readStream and read async

const isASCII = (str: string) => {
  // eslint-disable-next-line no-control-regex
  return /^[\x00-\x7F]*$/.test(str);
};

export const storedArray = async (name: string) => {
  const stats = await stat(name).catch(() => ({ size: 0 }));
  const queueWriting: string[] = [];
  const writeStream = createWriteStream(name, { flags: 'a' });

  const findCountOfRows = async () => {
    const readStream = createReadStream(name, {
      start: Math.max(0, stats.size - 256),
      highWaterMark: 1,
    });

    const findStart = letter => {
      if (letter === '\n') {
        rowIndexArray.length = 0;
        step.ref = readRowIndex;
        return false;
      }
      return false;
    };

    const rowIndexArray: string[] = [];
    const readRowIndex = (letter: string) => {
      if (letter === ' ') {
        step.ref = findStart;
        return false;
      }
      rowIndexArray.push(letter);
      return false;
    };
    const step = { ref: findStart };

    for await (const buffer of readStream.iterator() as AsyncIterableIterator<Buffer>) {
      if (step.ref(buffer.toString('utf8'))) {
        break;
      }
    }

    if (!rowIndexArray.length) {
      return 0;
    }

    return Number.parseInt(rowIndexArray.join('')) + 1;
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

        const findStart = (letter: string) => {
          if (letter === '\n') {
            step.ref = readRowIndex;
            return false;
          }
          return false;
        };

        const rowIndexArray: string[] = [];
        const readRowIndex = (letter: string) => {
          if (letter === ' ') {
            const rowIndex = Number.parseInt(rowIndexArray.join(''));

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
            // step.ref = readRowData;
          }
          rowIndexArray.push(letter);
          return false;
        };

        // const rowData: string[] = [];
        // const readRowData = (letter: string) => {
        //   if (letter === '\n') {
        //     return true;
        //   }
        //   rowData.push(letter);
        //   return false;
        // };

        const step = { ref: findStart, offset: 0, done: false };

        for await (const buffer of readStream.iterator({
          destroyOnReturn: true,
        }) as AsyncIterableIterator<Buffer>) {
          step.offset++;
          if (step.ref(buffer.toString('utf8'))) {
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
    push(data: string) {
      if (!isASCII(data)) {
        throw new Error('One byte symbols only allowed');
      }
      if (data.includes('\n')) {
        throw new Error('One line strings only allowed');
      }
      queueWriting.push(data);

      if (queueWriting.length > 1) {
        return;
      }

      while (queueWriting.length) {
        const queuedData = queueWriting[0];
        writeStream.write(`\n${countOfRows} ${queuedData}`);
        countOfRows += 1;
        stats.size += `\n${countOfRows} ${queuedData}`.length;
        queueWriting.shift();
      }
    },
  };
};
