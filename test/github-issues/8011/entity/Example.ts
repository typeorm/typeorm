import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

enum Category {
    MensAndWomensClothing = "Men's and Women's Clothing",
    Footwear = "Footwear",
}

@Entity()
export class Example {
    @PrimaryGeneratedColumn("increment")
    id: number

    @Column({ type: "enum", enum: Category })
    category: Category
}
