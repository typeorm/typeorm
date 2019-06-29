import {Column, Entity} from "../../../../../src";
import {PrimaryColumn} from "../../../../../src";
import {Generated} from "../../../../../src";

@Entity("aurora_data_api_test_post")
export class Post {

    @PrimaryColumn("integer")
    @Generated()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @Column({ nullable: false })
    likesCount: number;

}
