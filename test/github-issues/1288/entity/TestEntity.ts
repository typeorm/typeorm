import {Column, Entity, PrimaryGeneratedColumn} from "../../../../src";

@Entity("test_1288")
export class TestEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    /**
     * calculated column name ('id - name')
     */
    // TODO: @Column({
    //     sql: () => {
    //         return `CONCAT(id, "-", name, ${this.jName})`;
    //     }
    // })
    // idMinusName: string;

    /**
     * calculated column name with postfix '_'
     */
    @Column({
        sql: "CONCAT( id, name, \"_\")",
        aliasName: "pupel"
    })
    idName_: string;

    /**
     * calculated column name with space gap
     */
    @Column({
        sql: "CONCAT( id, \" \", name)"
    })
    idName: string;

    /**
     * @todo joinable column
     */
    jName: string = "fffffffff";
}