import { Column, Entity } from "../../../src/index";
import { ObjectIdColumn } from "../../../src/decorator/columns/ObjectIdColumn";
import { ObjectID } from "../../../src/driver/mongodb/typings";

import { PrimaryColumn } from "../../../src/decorator/columns/PrimaryColumn";
import { Generated } from "../../../src/decorator/Generated";
@Entity("sample34_post")
export class User {

    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    nickName: string;



}

@Entity("sample34_post")
export class Post2 {

    @PrimaryColumn("integer")
    @Generated()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @Column("int", {
        nullable: false
    })
    likesCount: number;

}