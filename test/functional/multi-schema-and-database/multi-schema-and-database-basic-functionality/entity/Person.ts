import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"

@Entity({ database: "secondDB" })
export class Person {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
