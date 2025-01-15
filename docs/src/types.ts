import { type ClassList } from "@qwik.dev/core";

export type OmitSignalClass<T> = Omit<T, "class"> & { class?: ClassList };
