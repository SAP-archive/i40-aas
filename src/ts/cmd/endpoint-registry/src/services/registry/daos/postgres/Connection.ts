
import "reflect-metadata";
import {createConnection, AdvancedConsoleLogger, Connection} from "typeorm";
import { Asset } from "../Entities/Asset";
import { Endpoint } from "../Entities/Endpoint";
import { AASDescriptor } from "../Entities/AASDescriptorEntity";


var pgConnection
if(
    process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_HOST &&
    process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_PORT  &&
    process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_USER &&
    process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_PASSWORD &&
    process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_NAME
    //maxConnections: 20,
    //idleTimeoutMillis: 30000,
    //connectionTimeoutMillis: 2000
)
{
 pgConnection = createConnection({
    type: "postgres",
    host: process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_HOST,
    port: +process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_PORT,
    username: process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_USER,
    password: process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_PASSWORD,
    database: process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_NAME,
    entities: [
      Asset, Endpoint, AASDescriptor
    ],
    synchronize: true,
    logging: false
});
}
else
console.error("One or more env. variables for the Postgres connection was not set");


export {pgConnection}
