import { Injectable } from '@angular/core';
import { Connection, createConnection } from '@typeorm/browser-core';
import { SqljsConnectionOptions, SqljsDriver } from '@typeorm/driver-browser-sqljs';
import { Author } from '../entity/Author';
import { Category } from '../entity/Category';
import { Post } from '../entity/Post';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private connection: Connection;

  constructor() { }

  async getConnection() {
    if (!this.connection)
      this.connection = await createConnection(<SqljsConnectionOptions>{
        name: "sqljs",
        type: "sqljs",
        platformType: "browser",
        location: "test",
        logging: true,
        autoSave: true,
        synchronize: true,
        entities: [Author, Category, Post],
        driver: SqljsDriver
      })
    return this.connection;
  }
}
