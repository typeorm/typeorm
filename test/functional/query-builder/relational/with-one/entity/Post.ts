import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../typeorm/decorator/columns/Column"
import { ManyToOne } from "../typeorm/decorator/relations/ManyToOne"
import { Category } from "./Category"
import { Image } from "./Image"
import { OneToOne } from "../typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "../typeorm/decorator/relations/JoinColumn"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne((type) => Category)
    category: Category

    @OneToOne((type) => Image, (image) => image.post)
    @JoinColumn()
    image: Image
}
