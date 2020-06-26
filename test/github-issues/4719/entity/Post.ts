import { Column, Entity, ObjectLiteral, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("hstore", {hstoreType: "object"})
    hstoreObj: ObjectLiteral;

}
