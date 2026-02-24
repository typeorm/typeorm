import { Column, Entity, OneToMany, PrimaryColumn } from "../../../../src"
import { Dependency } from "./dependency"

@Entity()
export class Example {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Dependency, (dependency) => dependency.from, {
        cascade: true,
        eager: true,
    })
    dependencies: Dependency[]
}
