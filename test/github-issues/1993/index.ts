import "reflect-metadata";
import { createConnection } from "typeorm";
import { Role } from "./entity/role.entity";
import { dataToInsert } from './data';

createConnection().then(async connection => {


    
}).catch(error => console.log(error));