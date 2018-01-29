import {Column, Entity, PrimaryGeneratedColumn} from "../../../../src";

@Entity("test_1288")
export class TestEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    width: number = 1;

    @Column()
    height: number = 1;

    /**
     * calculated column name ('id - name')
     */
    // TODO: @Column({
    //     sql: () => {
    //         return `(width + height) * ${this.rate})`;
    //     }
    // })
    // area: number;

    // rate: number = 3;

    /**
     * calculated column
     */
    @Column({
        sql: "width + height",
        aliasName: "pupel"
    })
    idName_area: string;

    /**
     * calculated column name with space gap
     */
    @Column({
        sql: "id || ' + ' || name"
    })
    idName: string;
}