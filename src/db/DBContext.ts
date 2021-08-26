import { Connection, ConnectionOptions, createConnection } from "typeorm";

class DBContext {
  defaultSettings: ConnectionOptions;
  connection: Connection;
  constructor() {
    this.defaultSettings = {
      type: "postgres",
      username: "postgres",
      password: "developer",
      host: "localhost",
      port: 5432,
      entities: ["./src/db/entities/*.entity.ts"],
      migrations: ["src/db/migration/*.ts"],
      migrationsTableName: "migrations",
      cli: {
        migrationsDir: "src/db/migration",
      },
    };
  }

  createDBConnection = async () => {
    this.connection = await createConnection(this.defaultSettings);
    if (this.connection.isConnected) {
      const existingDb = await this.connection.query(`
      SELECT datname
      FROM pg_catalog.pg_database
      WHERE lower(datname) = lower('graphql_typescript');
    `);
      if (existingDb === undefined || existingDb.length === 0) await this.connection.query(`CREATE DATABASE "graphql_typescript";`);
      this.connection.close();
      let settings: ConnectionOptions = { ...this.defaultSettings, name: "graphql_typescript", database: "graphql_typescript" } as ConnectionOptions;
      this.connection = await createConnection(settings);
      this.connection.runMigrations();
      if (this.connection.isConnected) console.log("DB Connected");
      else console.log("DB Not Connected");
    }
  };

  getDBConnection = async (): Promise<Connection> => {
    if (!this.connection) await this.createDBConnection();
    return this.connection;
  };
}
export default new DBContext();
