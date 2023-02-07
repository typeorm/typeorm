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
        asExpression: "CONCAT(`firstName`,' ',`lastName`)",
        generatedType: "STORED",
    })
    storedFullName: string

    @Column({
        asExpression: "`firstName` || `lastName`",
        generatedType: "STORED",
        collation: "latin1_bin",
    })
    name: string

    @Column({
        asExpression: "md5(coalesce(`firstName`,'0'))",
        generatedType: "STORED",
        type: "bytes",
        length: 255,
        nullable: true,
    })
    nameHash: string
}
