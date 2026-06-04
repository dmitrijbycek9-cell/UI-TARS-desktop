import { DatabaseSync } from 'node:sqlite';

export abstract class BaseStore {
  protected db: DatabaseSync;
  protected initialized = false;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  abstract initialize(): void;
}
