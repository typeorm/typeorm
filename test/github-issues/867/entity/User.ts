import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Index } from "typeorm/decorator/Index"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    @Index()
    username: string
}
