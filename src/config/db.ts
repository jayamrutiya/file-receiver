import { injectable } from "inversify";
import { IDatabaseService } from "../interfaces/IDatabaseService";
import { Database } from "db-sdk/dist";

@injectable()
export class DatabaseService implements IDatabaseService {
  private _db: any;
  private database = new Database();

  // public constructor() {
  //   this._db = this.database.createDBconnection();
  // }

  public async connect() {
    this._db = await this.database.createDBconnection();
    return this.database;
  }
}
