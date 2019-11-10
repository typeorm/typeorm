/**
 * Special options passed to Repository#clear
 */
import {PostgresClearOptions} from "../driver/postgres/PostgresClearOptions";

// todo as we add support for other driver truncat options (e.g. oracle) we would extend here
export type ClearOptions =
    PostgresClearOptions;
