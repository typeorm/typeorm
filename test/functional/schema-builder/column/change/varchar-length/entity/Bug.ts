import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../../../../src"

export const OLD_COLLATION = "POSIX"
export const NEW_COLLATION = "C"

@Entity("bug")
export class Bug {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 50, collation: OLD_COLLATION })
    example: string
}
