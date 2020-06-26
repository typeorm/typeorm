import { Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class AccessToken {

    @PrimaryColumn()
    access_token: string;

}
