import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    useTitle: boolean

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column({
        asExpression: `CONCAT("firstName", "lastName")`,
        length: 700,
        generatedType: "VIRTUAL",
    })
    virtualFullName: string

    @Column({
        asExpression: `"firstName" || ' ' || "lastName"`,
        length: 700,
    })
    name: string

    @Column({
        generatedType: "VIRTUAL",
        asExpression: `standard_hash(coalesce("firstName",'MD5'))`,
        type: "varchar",
        length: 255,
        nullable: true,
    })
    nameHash: string
}
