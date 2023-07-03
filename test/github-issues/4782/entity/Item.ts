import { CreateDateColumn } from "../../../../src"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "../../../../src/decorator/entity/Entity"

@Entity()
export class Item {
    @PrimaryGeneratedColumn()
    id: number

    @CreateDateColumn()
    date: Date
}
