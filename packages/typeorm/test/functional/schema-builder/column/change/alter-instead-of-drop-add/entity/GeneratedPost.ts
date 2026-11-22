import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../../../../src"

@Entity()
export class GeneratedPost {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 10 })
    firstName: string

    @Column({
        type: "varchar",
        length: 20,
        generatedType: "STORED",
        asExpression: `"firstName" || 'x'`,
    })
    fullName: string
}
