const fs = require('fs');

// Create a writable stream to a file
const writeStream = fs.createWriteStream('output.txt');

// Write a byte (value 99) to the stream
writeStream.write(new Uint8Array(new Uint32Array([990000]).buffer));

// Wait for the write operation to finish
writeStream.end(() => {
  // Get the number of bytes written
  const bytesWritten = writeStream.bytesWritten;

  console.log(`Bytes written: ${bytesWritten}`);
});
