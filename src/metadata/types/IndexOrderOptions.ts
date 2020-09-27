import {OrderByCondition} from "../..";

/**
 * Used to specify a sort order used in index creation.
 */
export type IndexOrderOptions = OrderByCondition | ("ASC"|"DESC");
