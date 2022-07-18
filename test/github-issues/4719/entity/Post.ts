import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ObjectLiteral,
} from "typeorm/index"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column("hstore", { hstoreType: "object" })
    hstoreObj: ObjectLiteral
}
