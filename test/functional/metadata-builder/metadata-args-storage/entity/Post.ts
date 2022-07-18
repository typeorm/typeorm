import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { ContentModule } from "./ContentModule"

@Entity()
export class Post extends ContentModule {
    @Column()
    title: string

    @Column()
    text: string
}
