import { Column } from "../../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { OneToMany } from "../../../../../../src/decorator/relations/OneToMany"
import { Setting } from "./Setting"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Setting, (setting) => setting.user, {
        cascade: true,
        eager: true,
    })
    settings: Setting[]

    constructor(name: string) {
        this.name = name
    }
}
