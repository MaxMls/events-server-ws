import { createReadStream, createWriteStream } from 'fs';
import { stat, writeFile } from 'fs/promises';

/** 
[\n] [size uint32] [data]

data - [random byte] [\] [n]
data - [random byte] [\] [\] [n]

data - [random byte] a b \ c
data - [random byte] a b \ \ c

a b \ . \ n uint32 d e f -   \n is not control
a \ \ . \ n - is control
\ \ \ . \ n - is not control

1 skip all \
\ \ \ \ . n - is not control


1 skip to first non \ symbol


let escaped = false
for byte in bytes
if escaped 
  if byte = n
    split
  else
    push byte
  escaped = false
else if byte = \
  escaped = true
*/
export const storedArrayBinary = async (
  name: string,
  rowByteLength: number
) => {
  const stats = await stat(name).catch(() => ({ size: 0 }));
  const queueWriting: Buffer[] = [];
  const writeStream = createWriteStream(name, { flags: 'a' });

  const findCountOfRows = () => {
    return stats.size / rowByteLength;
  };

  let countOfRows = stats.size ? findCountOfRows() : 0;
  console.log({ countOfRows });

  return {
    get length(): number {
      return countOfRows;
    },
    at(index: number) {
      return createReadStream(name, {
        start: index * rowByteLength,
      });
    },
    push(data: Buffer) {
      if (data.byteLength !== rowByteLength) {
        throw new Error('Invalid data size');
      }
      queueWriting.push(data);

      if (queueWriting.length > 1) {
        return;
      }

      while (queueWriting.length) {
        const queuedData = queueWriting[0];
        writeStream.write(queuedData);
        countOfRows += 1;
        stats.size += rowByteLength;
        queueWriting.shift();
      }
    },
  };
};
