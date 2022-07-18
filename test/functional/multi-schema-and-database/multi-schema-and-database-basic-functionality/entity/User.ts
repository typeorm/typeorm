import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"

@Entity({ schema: "userSchema" })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
