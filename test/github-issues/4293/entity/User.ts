import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

const transformer = {
    to: (value: number | undefined) => (value ? value * 100 : value),
    from: (value: number | undefined) => (value ? value / 100 : value),
}

export enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        transformer,
        default: transformer.to(25),
    })
    balance: number

    @Column({
        type: "enum",
        enum: UserStatus,
        default: UserStatus.ACTIVE,
    })
    status: UserStatus
}
