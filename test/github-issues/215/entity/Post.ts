import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Author } from "./Author"
import { Abbreviation } from "./Abbreviation"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @OneToOne((type) => Author)
    @JoinColumn({ name: "author_id" })
    author: Author

    @OneToOne((type) => Abbreviation)
    @JoinColumn({ name: "abbreviation_id" })
    abbreviation: Abbreviation
}
