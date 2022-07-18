import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ImageInfo } from "./ImageInfo"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"

@Entity()
export class Image {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @OneToMany((type) => ImageInfo, (imageInfo) => imageInfo.image)
    informations: ImageInfo[] = []
}
