import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { TypeormTestSecondary } from "./secondary.entity"
import { TypeormTestTertiary } from "./tertiary.entity"

@Entity()
export class TypeormTestPrimary {
    @PrimaryGeneratedColumn({ type: "int" })
    ID: number

    @Column({ type: "int" })
    SecondaryID: number

    @ManyToOne(() => TypeormTestSecondary)
    @JoinColumn({ name: "SecondaryID", referencedColumnName: "ID" })
    secondary: TypeormTestSecondary

    @ManyToOne(() => TypeormTestTertiary)
    @JoinColumn({
        name: "SecondaryID",
        referencedColumnName: "UserID",
        foreignKeyConstraintName: "FK_SecondaryID_UserID",
    })
    tertiary: TypeormTestTertiary
}
