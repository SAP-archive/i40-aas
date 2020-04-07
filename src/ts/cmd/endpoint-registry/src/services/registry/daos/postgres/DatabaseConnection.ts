
import "reflect-metadata";
import {createConnection, AdvancedConsoleLogger, Connection} from "typeorm";
import { AssetEntity } from "../entities/AssetEntity";
import { EndpointEntity } from "../entities/EndpointEntity";
import { AASDescriptorEntity } from "../entities/AASDescriptorEntity";

 class DatabaseConnection{
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;

 constructor(host:string,port:number,username:string, pass:string, database:string) {

  this.host = host;
  this.port =port;
  this.username = username;
  this.password = pass;
  this.database = database;
 };

connectDB(){

   var pgConnection:Promise<Connection> = createConnection({
    type: "postgres",
    host: this.host,
    port: this.port,
    username: this.username,
    password: this.password,
    database: this.database,
    entities: [
      AssetEntity, EndpointEntity, AASDescriptorEntity
    ],
    synchronize: true,
    logging: false
});
return pgConnection;
}

}

export{DatabaseConnection}

