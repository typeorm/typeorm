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
  id: number;

  @Column()
  name: string;

  @OneToOne((type) => Category, (category) => category.oneInverseCategory, {
    cascade: true,
  })
  @JoinColumn()
  oneCategory: Category;

  @OneToOne((type) => Category, (category) => category.oneCategory)
  oneInverseCategory: Category;

  @ManyToOne((type) => Category, (category) => category.oneManyCategories)
  oneManyCategory: Category;

  @OneToMany((type) => Category, (category) => category.oneManyCategory, {
    cascade: ["insert", "update"], // Removed "remove" cascade
  })
  oneManyCategories: Category[];

  @ManyToMany(
    (type) => Category,
    (category) => category.manyInverseCategories,
    {
      cascade: ["insert", "update"], // Removed "remove" cascade
    }
  )
  @JoinTable()
  manyCategories: Category[];

  @ManyToMany((type) => Category, (category) => category.manyCategories)
  manyInverseCategories: Category[];
}
