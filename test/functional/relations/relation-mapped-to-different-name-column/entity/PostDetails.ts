import { Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class PostDetails {

    @PrimaryColumn()
    keyword: string;

}
