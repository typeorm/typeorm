import { Column } from "../../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "../../../../../../src/decorator/entity/Entity"

@Entity()
export class Profile {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    about: string
}
