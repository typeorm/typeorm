import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../src"

@Entity({
    name: "user",
})
export class UserWithoutVersioning extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
