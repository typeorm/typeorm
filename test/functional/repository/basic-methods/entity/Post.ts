import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { CreateDateColumn, ManyToOne, UpdateDateColumn } from "typeorm"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number | undefined | null | string

    @Column({
        nullable: true,
        unique: true,
        name: "eXtErNal___id", // makes sure we test handling differing property/database names where necessary
    })
    externalId?: string

    @Column()
    title: string

    @Column({ nullable: true })
    subTitle: string

    @Column({
        nullable: true,
        type: "date",
        transformer: {
            from: (value: any) => new Date(value),
            to: (value?: Date) => value?.toISOString(),
        },
    })
    dateAdded?: Date

    @ManyToOne(() => Category, { nullable: true })
    category?: Category

    @CreateDateColumn()
    createdAt!: Date

    @UpdateDateColumn({
        name: "uPdAtEd___At", // makes sure we test handling differing property/database names where necessary
    })
    updatedAt!: Date
}
