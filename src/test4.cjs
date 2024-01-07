const { exec } = require('child_process');

const locations = [
  { name: 'Dallas, TX', ip: '198.23.249.100' },
  { name: 'Chicago, IL', ip: '198.23.228.15' },
  { name: 'Atlanta', ip: '107.173.164.160' },
  { name: 'San Jose, CA', ip: '192.210.207.88' },
  { name: 'New York', ip: '192.3.81.8' },
  { name: 'Ashburn', ip: '107.173.166.10' },
  { name: 'Los Angeles DC02', ip: '204.13.154.3' },
];

let lowestPing = Infinity;
let bestLocation = null;

async function pingLocation(location) {
  return new Promise(resolve => {
    const command = `ping -c 8 ${location.ip}`;

    exec(command, (error, stdout) => {
      if (error) {
        console.error(error);
        resolve(Infinity); // Consider an unreachable location as having maximum ping
      } else {
        // Define a regex pattern to match the average value
        const avgRegex = /avg\D+(\d+\.\d+)/;

        // Use the regex pattern to extract the average value
        const match = stdout.match(avgRegex);

        // Check if a match is found
        if (match && match[1]) {
          // Extracted average value
          const avgValue = parseFloat(match[1]);

          resolve(avgValue);
          console.log('Average Value:');
        } else {
          console.log('Average value not found in the input string.');
        }
      }
    });
  });
}

async function findBestLocation() {
  for (const location of locations) {
    const ping = await pingLocation(location);
    console.log(`Ping for ${location.name}: ${ping} ms`);

    if (ping < lowestPing) {
      lowestPing = ping;
      bestLocation = location.name;
    }
  }

  console.log(`Best location: ${bestLocation} with ping ${lowestPing} ms`);
}

// Run the script
findBestLocation();
// SwZGjNhr1
