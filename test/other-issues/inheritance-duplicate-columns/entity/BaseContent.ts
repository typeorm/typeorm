import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"

export class BaseContent {
    @PrimaryGeneratedColumn()
    id: number
}
