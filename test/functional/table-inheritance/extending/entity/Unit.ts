import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"

export class Unit {
    @PrimaryGeneratedColumn()
    id: number
}
