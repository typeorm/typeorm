import { $, component$, sync$, useSignal } from "@qwik.dev/core";
import { SearchIcon } from "../Icons/SearchIcon";

type SearchResult = {
    id: number;
    title: string;
    description: string;
};

const mockResults: SearchResult[] = [
    {
        id: 1,
        title: "React Hooks",
        description: "Learn about React Hooks and their usage",
    },
    {
        id: 2,
        title: "Tailwind CSS",
        description: "A utility-first CSS framework",
    },
    {
        id: 3,
        title: "TypeScript",
        description: "JavaScript with syntax for types",
    },
];

export const SearchBar = component$(() => {
    const isOpenSig = useSignal(false);
    const searchQuerySig = useSignal("");
    const inputElSig = useSignal<HTMLInputElement>();
    const resultsSig = useSignal<SearchResult[]>([]);

    const handleSearch = $((query: string) => {
        searchQuerySig.value = query;
        const filtered = mockResults.filter(
            (result) =>
                result.title.toLowerCase().includes(query.toLowerCase()) ||
                result.description.toLowerCase().includes(query.toLowerCase()),
        );
        resultsSig.value = filtered;
    });

    return (
        <>
            <button
                onClick$={() => {
                    isOpenSig.value = true;
                    setTimeout(
                        () => inputElSig.value && inputElSig.value.focus(),
                        60,
                    );
                }}
                class="flex items-center gap-2 py-2 pr-1 text-black transition-colors hover:opacity-80 dark:text-white"
            >
                <SearchIcon />
            </button>
            {isOpenSig.value && (
                <div
                    class="fixed inset-0 z-50 bg-black/70"
                    window:onKeyDown$={[
                        sync$((event: KeyboardEvent) => {
                            if (
                                event.key === "k" &&
                                (event.metaKey || event.ctrlKey)
                            ) {
                                event.preventDefault();
                            }
                        }),
                        $((event) => {
                            if (
                                (event.key === "Escape" && isOpenSig.value) ||
                                (event.key === "k" &&
                                    (event.metaKey || event.ctrlKey)) ||
                                (event.key === "/" && !isOpenSig.value)
                            ) {
                                event.preventDefault();
                                if (isOpenSig.value) {
                                    isOpenSig.value = false;
                                }
                            }
                        }),
                    ]}
                >
                    <div class="animate-slide-down fixed inset-x-0 top-[80px] mx-auto max-w-3xl border-2 border-black bg-white p-4 shadow-lg dark:border-white dark:bg-black">
                        <div class="mx-auto max-w-3xl">
                            <div class="relative">
                                <SearchIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-black dark:text-white" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuerySig.value}
                                    onInput$={(_, t) => handleSearch(t.value)}
                                    class="w-full rounded-lg bg-white py-3 pl-14 pr-4 text-black dark:bg-black dark:text-white"
                                    ref={inputElSig}
                                />
                                <button
                                    onClick$={() => {
                                        isOpenSig.value = false;
                                        searchQuerySig.value = "";
                                    }}
                                    class="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:opacity-80 dark:text-white"
                                >
                                    ESC
                                </button>
                            </div>

                            {/* Search results */}
                            {searchQuerySig.value && (
                                <div class="mt-4 space-y-2">
                                    {resultsSig.value.length > 0 ? (
                                        resultsSig.value.map((result) => (
                                            <div
                                                key={result.id}
                                                class="cursor-pointer rounded-lg p-4 text-black transition-colors hover:opacity-80 dark:text-white"
                                            >
                                                <h3 class="font-medium">
                                                    {result.title}
                                                </h3>
                                                <p class="text-sm">
                                                    {result.description}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div class="py-12 text-center text-black dark:text-white">
                                            No results found for "
                                            {searchQuerySig.value}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});
