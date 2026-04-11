import {
    Column,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../src/index"
import { Image } from "./Image"

@Entity("sample10_image_details")
export class ImageDetails {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    meta: string

    @Column()
    comment: string

    @OneToOne(() => Image, (image) => image.details)
    image: Image
}
