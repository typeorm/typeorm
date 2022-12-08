import {
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { Image } from "./Image"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @OneToOne(() => Image, (image) => image.defaultImageOf)
    @JoinColumn()
    image: Image
}
