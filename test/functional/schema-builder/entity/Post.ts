import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { Unique } from "typeorm/decorator/Unique"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Check } from "typeorm/decorator/Check"
import { Exclusion } from "typeorm/decorator/Exclusion"

@Entity()
@Unique(["text", "tag"])
@Exclusion(`USING gist ("text" WITH =)`)
@Check(`"likesCount" < 1000`)
// @Check(`\`likesCount\` < 1000`) // should be properly escaped for each driver.
export class Post {
    @PrimaryColumn()
    id: number

    @Column({ unique: true })
    version: string

    @Column({ nullable: true, default: "My post" })
    name: string

    @Column({ nullable: true })
    text: string

    @Column()
    tag: string

    @Column()
    likesCount: number
}
