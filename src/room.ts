import { storedArrayBinaryLog } from './data-storage-binary-log.js';

export class Room {
  storedArray: ReturnType<typeof storedArrayBinaryLog>;

  constructor(name) {
    this.storedArray = storedArrayBinaryLog('mememe');
  }

  async message(data: ArrayBuffer) {
    (await this.storedArray).push(data);
  }

  // async connection() {
  //   (await this.storedArray).at(0);
  // }
}
