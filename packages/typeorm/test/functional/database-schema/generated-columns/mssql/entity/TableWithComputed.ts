import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../../src"

@Entity()
export class TableWithComputed {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column({
        asExpression: `"firstName" + ' ' + "lastName"`,
        generatedType: "STORED",
    })
    fullName: string
}
