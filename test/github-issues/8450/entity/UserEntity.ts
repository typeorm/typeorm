import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";

@Entity("user")
export class UserEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: "int",
        generatedType: "STORED",
        asExpression: "id * 2",
    })
    generated: number;

}
