import {
    Column,
    Entity,
    FindOperator,
    PrimaryGeneratedColumn,
    ValueTransformer,
} from "../../../../../src"

export class DateTime {
    constructor(private date: Date) {}

    static fromJSDate(date: Date) {
        return new DateTime(date)
    }

    toJSDate() {
        return this.date
    }

    equals(other: DateTime) {
        return other.date.getTime() === this.date.getTime()
    }
}

export class LuxonTimestampTzTypeT implements ValueTransformer {
    public to(
        value: DateTime | null | undefined | FindOperator<any>,
    ): Date | null | FindOperator<any> {
        if (value === null || value === undefined) {
            return null
        } else if (value instanceof FindOperator) {
            return value
        }
        return value.toJSDate()
    }

    public from(value: Date | string | null | undefined): DateTime | null {
        if (value === null || value === undefined) {
            return null
        } else if (typeof value === "string") {
            return new DateTime(new Date(value))
        }
        return DateTime.fromJSDate(value)
    }
}

@Entity()
export class PostWithLuxonDate {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "timestamp", transformer: new LuxonTimestampTzTypeT() })
    date: DateTime
}
