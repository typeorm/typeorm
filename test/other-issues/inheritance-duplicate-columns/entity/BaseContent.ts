import { PrimaryGeneratedColumn } from "@typeorm/core";

export class BaseContent {

    @PrimaryGeneratedColumn()
    id: number;

}
