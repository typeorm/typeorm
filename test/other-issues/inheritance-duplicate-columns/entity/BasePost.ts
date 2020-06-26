import { PrimaryGeneratedColumn } from "@typeorm/core";
import { BaseContent } from "./BaseContent";

export class BasePost extends BaseContent {

    @PrimaryGeneratedColumn()
    id: number;

}
