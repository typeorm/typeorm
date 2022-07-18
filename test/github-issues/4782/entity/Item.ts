import { CreateDateColumn } from "typeorm"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"

@Entity()
export class Item {
    @PrimaryGeneratedColumn()
    id: number

    @CreateDateColumn()
    date: Date
}
