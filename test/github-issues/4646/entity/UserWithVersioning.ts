import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../src"

@Entity({
    name: "user",
    versioning: true,
})
export class UserWithVersioning extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
