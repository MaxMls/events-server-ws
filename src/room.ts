import { storedArray } from './data-storage.js';

export class Room {
  storedArray: ReturnType<typeof storedArray>;

  constructor(name) {
    this.storedArray = storedArray('mememe');
  }

  async message(data: string) {
    (await this.storedArray).push(data);
  }

  async connection() {
    (await this.storedArray).at(0);
  }
}
