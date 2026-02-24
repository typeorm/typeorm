import { ReturningOption } from "../query-builder/ReturningOption"

/**
 * Special options passed to Repository#update and updateAll.
 */
export interface UpdateOptions {
    /**
     * Allows selecting custom RETURNING / OUTPUT clause.
     * Works only on drivers with returning support.
     */
    returning?: ReturningOption
}
