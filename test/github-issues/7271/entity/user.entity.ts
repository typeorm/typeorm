import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from "../../../../src";

@Entity("users")
export class UserEntity {
    @PrimaryGeneratedColumn()
    id?: number;

    @Index({ unique: true })
    @Column({
        type: "varchar",
        length: 128,
        name: "email",
        nullable: true,
    })
    email: string;

    @Index({ unique: false })
    @Column({
        type: "int",
        name: "role_id",
    })
    roleId: number;

    @Column({
        type: "varchar",
        length: 256,
        name: "password_hash",
    })
    passwordHash: string;

    
    @Index({ unique: true })
    @Column({
        type: "varchar",
        length: 64,
        name: "nick_name",
    })
    nickName: string;


    @CreateDateColumn({
        type: "timestamptz",
        name: "created_at",
        default: () => "CURRENT_TIMESTAMP",
    })
    createdAt?: string;

    @UpdateDateColumn({
        type: "timestamptz",
        name: "updated_at",
        default: () => "CURRENT_TIMESTAMP",
    })
    updatedAt?: string;
}
