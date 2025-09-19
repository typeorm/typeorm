import {
    Column,
    Entity,
    ManyToMany,
    PrimaryGeneratedColumn,
} from "../../../src/index"
import { ManyToOne } from "../../../src/decorator/relations/ManyToOne"
import { OneToMany } from "../../../src/decorator/relations/OneToMany"
import { OneToOne } from "../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../src/decorator/relations/JoinColumn"
import { JoinTable } from "../../../src/decorator/relations/JoinTable"

@Entity("sample8_category")
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToOne(() => Category, (category) => category.oneInverseCategory, {
        cascade: true,
    })
    @JoinColumn()
    oneCategory: Category

    @OneToOne(() => Category, (category) => category.oneCategory, {
        cascade: true,
    })
    oneInverseCategory: Category

    @ManyToOne(() => Category, (category) => category.oneManyCategories, {
        cascade: true,
    })
    oneManyCategory: Category

    @OneToMany(() => Category, (category) => category.oneManyCategory, {
        cascade: true,
    })
    oneManyCategories: Category[]

    @ManyToMany(() => Category, (category) => category.manyInverseCategories, {
        cascade: true,
    })
    @JoinTable()
    manyCategories: Category[]

    @ManyToMany(() => Category, (category) => category.manyCategories, {
        cascade: true,
    })
    manyInverseCategories: Category[]
}
