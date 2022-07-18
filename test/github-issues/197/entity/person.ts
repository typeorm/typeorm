import { Entity } from "typeorm/decorator/entity/Entity"
import { Index } from "typeorm/decorator/Index"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Person {
    @PrimaryGeneratedColumn()
    id: number

    @Index({
        unique: true,
    })
    @Column()
    firstname: string

    @Column()
    lastname: string
}
