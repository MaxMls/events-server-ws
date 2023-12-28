import { createReadStream, createWriteStream } from 'fs';
import { stat } from 'fs/promises';
// todo: compare readStream and read async

const isASCII = (str: string) => {
  // eslint-disable-next-line no-control-regex
  return /^[\x00-\x7F]*$/.test(str);
};

export const storedArray = async (name: string) => {
  const stats = await stat(name);
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

  let countOfRows = await findCountOfRows();
  console.log({ countOfRows });

  return {
    get length(): number {
      return countOfRows;
    },
    async at(index) {
      let left = 0;
      let right = stats.size;

      while (left < right) {
        const position = left + Math.floor((right - left) / 2);

        const readStream = createReadStream(name, {
          start: position,
          highWaterMark: 1,
          emitClose: false,
        });

        const findStart = letter => {
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
              left = position + 1;
              return true;
            }
            if (rowIndex > index) {
              // left half
              right = position;
              return true;
            }

            step.ref = readRowData;
          }
          rowIndexArray.push(letter);
          return false;
        };

        const rowData: string[] = [];
        const readRowData = (letter: string) => {
          if (letter === '\n') {
            return true;
          }
          rowData.push(letter);
          return false;
        };

        const step = { ref: findStart };

        for await (const buffer of readStream.iterator() as AsyncIterableIterator<Buffer>) {
          if (step.ref(buffer.toString('utf8'))) {
            break;
          }
        }

        if (!rowIndexArray.length) {
          // left half
          right = position;
          continue;
        }

        if (rowData.length) {
          return rowData.join('');
        }
      }
      console.log({ left, right });

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
