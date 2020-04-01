
import "reflect-metadata";
import {createConnection, AdvancedConsoleLogger, Connection} from "typeorm";
import { Asset } from "../Entities/AssetEntity";
import { Endpoint } from "../Entities/EndpointEntity";
import { AASDescriptor } from "../Entities/AASDescriptorEntity";

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
      Asset, Endpoint, AASDescriptor
    ],
    synchronize: true,
    logging: false
});
return pgConnection;
}

}

export{DatabaseConnection}

