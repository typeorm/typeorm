import {
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn
} from "@typeorm/core";

@Entity("sample8_category")
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(type => Category, category => category.oneInverseCategory, {
        cascade: true
    })
    @JoinColumn()
    oneCategory: Category;

    @OneToOne(type => Category, category => category.oneCategory, {
        cascade: true
    })
    oneInverseCategory: Category;

    @ManyToOne(type => Category, category => category.oneManyCategories, {
        cascade: true
    })
    oneManyCategory: Category;

    @OneToMany(type => Category, category => category.oneManyCategory, {
        cascade: true
    })
    oneManyCategories: Category[];

    @ManyToMany(type => Category, category => category.manyInverseCategories, {
        cascade: true
    })
    @JoinTable()
    manyCategories: Category[];

    @ManyToMany(type => Category, category => category.manyCategories, {
        cascade: true
    })
    manyInverseCategories: Category[];

}
