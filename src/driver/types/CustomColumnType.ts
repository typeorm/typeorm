import { Driver } from "../Driver"

export interface CustomColumnType {
    getDatabaseIdentifier(driver: Driver): string
}
