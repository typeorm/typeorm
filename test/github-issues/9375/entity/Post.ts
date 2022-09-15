import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../src/decorator/columns/Column"
import { UpdateDateColumn } from "../../../../src/decorator/columns/UpdateDateColumn"
import { ColumnOptions } from "../../../../src/decorator/options/ColumnOptions"

class DateWrapper {
    constructor(public readonly date: Date) {}
}

const baseOpts: ColumnOptions = {
    type: Date,
    transformer: {
        to(value?: DateWrapper | Date): Date | undefined {
            return value
                ? value instanceof DateWrapper
                    ? value.date
                    : value
                : undefined
        },
        from(value?: DateWrapper | Date): DateWrapper | undefined {
            return value
                ? value instanceof Date
                    ? new DateWrapper(value)
                    : value
                : undefined
        },
    },
}

export const UpdateDateTimeColumn = (
    options?: ColumnOptions,
): PropertyDecorator => {
    return (target: any, propertyKey: string | symbol): void => {
        const opt: ColumnOptions = {
            ...options,
            ...baseOpts,
        }
        UpdateDateColumn(opt)(target, propertyKey)
    }
}

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @UpdateDateTimeColumn()
    updatedAt: DateWrapper
}
