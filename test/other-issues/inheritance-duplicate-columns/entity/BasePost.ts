import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { BaseContent } from "./BaseContent"

export class BasePost extends BaseContent {
    @PrimaryGeneratedColumn()
    id: number
}
