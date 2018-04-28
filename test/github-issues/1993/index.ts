import "reflect-metadata";
import { createConnection } from "typeorm";

createConnection().then(async connection => {}).catch(error => console.log(error));