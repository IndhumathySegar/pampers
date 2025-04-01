import chalk from "chalk";
import mongoose from "mongoose";
import { get } from "lodash";

import Logger from "./logger";

const MONGO_URI = process.env.MONGO_URI!;

class CreateDBConnection {
  private Connection: mongoose.Connection;
  private databaseNames: { [dbName: string]: mongoose.Connection } = {};

  constructor() {
    this.createConnection();
  }

  get connection() {
    if (!this.Connection) {
      this.createConnection();
    }

    return this;
  }

  /**
   * Common Use DB `this avoid connection leaks`
   * @param {string} databaseName Name of database
   * @returns {mongoose.Connection} Mongodb connection instance
   */
  useDb(databaseName: string) {
    if (this.databaseNames[databaseName]) {
      return this.databaseNames[databaseName];
    }

    this.databaseNames[databaseName] = this.Connection.useDb(databaseName);

    return this.databaseNames[databaseName];
  }

  /**
   * Get Dynamic Connection
   * @param {string} locale Locale
   * @return {Promise<mongoose.Connection>} Mongoose Connection
   */
  async getDynamicConnection(locale: string): Promise<mongoose.Connection> {
    return this.createConnection(locale);
  }

  /**
   * Get Mongo Uri for dynamic connection
   * @param {string} locale Locale
   * @return {string} Mongo Connection URI
   */
  getMongoUri(locale: string): string {
    const mongoConnectionString = get(
      process.env,
      `${locale}_MONGO_URI`,
      false
    );

    if (!mongoConnectionString) {
      throw new Error("Config not found");
    }

    return mongoConnectionString;
  }

  /**
   * Create Connection
   * @param {string} locale Locale
   * @return {mongoose.Connection} Mongo Connection
   */
  private createConnection(locale?: string): mongoose.Connection {
    try {
      let mongoConnectionString: string = MONGO_URI;
      if (locale) {
        mongoConnectionString = this.getMongoUri(locale);
      }
      console.log({ mongoConnectionString, locale });

      const connection = mongoose.createConnection(mongoConnectionString, {
        autoIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      if (locale) {
        return connection;
      }

      this.Connection = connection;
    } catch (err: unknown) {
      Logger.error(err);
      Logger.error(
        `${chalk.red(
          "✘"
        )} MongoDB connection error. Please make sure MongoDB is running.`
      );

      process.exit(1);
    }

    // connection established
    Logger.info(`${chalk.green("✔")} MongoDB connected successfully`);

    return this.Connection;
  }
}

export default new CreateDBConnection();
