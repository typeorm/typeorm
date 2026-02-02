import { ReturningOption } from "../query-builder/ReturningOption"

/**
 * Special options passed to Repository#delete and deleteAll.
 */
export interface DeleteOptions {
    /**
     * Allows selecting custom RETURNING / OUTPUT clause.
     * Works only on drivers with returning support.
     */
    returning?: ReturningOption
}
