const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const testFilePath = path.join(__dirname, 'testfile.txt');
const fileSizeMB = 100; // Change this to your desired file size in MB

// Create a test file with random data
function createTestFile(filePath, sizeInMB) {
  const data = Buffer.alloc(sizeInMB * 1024 * 1024, 'a'); // Fill file with 'a'
  fs.writeFileSync(filePath, data);
}

// Test file creation
createTestFile(testFilePath, fileSizeMB);

// Function to test fs.createReadStream performance
function testReadStreamPerformance(highWaterMark) {
  const startTime = performance.now();

  const readStream = fs.createReadStream(testFilePath, { highWaterMark });

  readStream.on('data', chunk => {
    // Do something with the data if needed
  });

  readStream.on('end', () => {
    const endTime = performance.now();
    const elapsedTime = endTime - startTime;

    console.log(
      `HighWaterMark: ${highWaterMark}, Elapsed Time: ${elapsedTime} ms`
    );
  });

  readStream.on('error', error => {
    console.error('Error:', error);
  });
}

// Test with highWaterMark set to 1
testReadStreamPerformance(1000);

// Test with default highWaterMark
// testReadStreamPerformance(); // equivalent to testReadStreamPerformance(undefined)
