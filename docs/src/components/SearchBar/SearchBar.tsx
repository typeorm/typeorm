import {
    $,
    component$,
    QRL,
    sync$,
    useSignal,
    useVisibleTask$,
} from "@qwik.dev/core";
import { SearchIcon } from "../Icons/SearchIcon";

type SearchResult = {
    id: number;
    url: string;
    type: "lvl0" | "lvl1" | "lvl2" | "lvl3" | "lvl4" | "lvl5" | "lvl6";
    hierarchy: {
        lvl0: "Documentation" | "Support" | "Changelog";
        lvl1: string;
        lvl2: string;
        lvl3: string;
        lvl4: string;
        lvl5: string;
        lvl6: string;
    };
};

const AUTOCOMPLETE_RECENT_SEARCHES = "AUTOCOMPLETE_RECENT_SEARCHES";

export const useDebouncer = <A extends readonly unknown[], R>(
    fn: QRL<(...args: A) => R>,
    delay: number,
): QRL<(...args: A) => void> => {
    const timeoutId = useSignal<number>();

    return $((...args: A): void => {
        window.clearTimeout(timeoutId.value);
        timeoutId.value = window.setTimeout((): void => {
            void fn(...(args as any));
        }, delay);
    });
};

export const SearchBar = component$(() => {
    const isOpenSig = useSignal(false);
    const searchQuerySig = useSignal("");
    const inputElSig = useSignal<HTMLInputElement>();
    const recentResultsSig = useSignal<SearchResult[]>([]);
    const docResultsSig = useSignal<SearchResult[]>([]);
    const supportResultsSig = useSignal<SearchResult[]>([]);

    const searchWithDebounce = useDebouncer(
        $(async (query: string) => {
            searchQuerySig.value = query;
            const response = await fetch(
                `https://2uukvsbt3m-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20JavaScript%20(5.19.0)%3B%20Lite%20(5.19.0)%3B%20Browser%3B%20docsearch%20(3.8.3)%3B%20docsearch-react%20(3.8.3)%3B%20docsearch.js%20(3.8.3)&x-algolia-api-key=${import.meta.env.VITE_ALGOLIA_API_KEY}&x-algolia-application-id=${import.meta.env.VITE_ALGOLIA_APP_ID}`,
                {
                    body: `{"requests":[{"query":"${query}","indexName":"typeorm","attributesToRetrieve":["hierarchy.lvl0","hierarchy.lvl1","hierarchy.lvl2","hierarchy.lvl3","hierarchy.lvl4","hierarchy.lvl5","hierarchy.lvl6","content","type","url"],"attributesToSnippet":["hierarchy.lvl1:10","hierarchy.lvl2:10","hierarchy.lvl3:10","hierarchy.lvl4:10","hierarchy.lvl5:10","hierarchy.lvl6:10","content:10"],"snippetEllipsisText":"…","highlightPreTag":"<mark>","highlightPostTag":"</mark>","hitsPerPage":20,"clickAnalytics":false}]}`,
                    method: "POST",
                },
            );
            const { results = [{ hits: [] }] } = await response.json();
            const hits: SearchResult[] = results[0].hits;
            docResultsSig.value = hits.filter(
                (item) => item.hierarchy.lvl0 === "Documentation",
            );
            supportResultsSig.value = hits.filter(
                (item) => item.hierarchy.lvl0 === "Support",
            );
        }),
        1000,
    );

    const saveRecentSearches = $(() =>
        localStorage.setItem(
            AUTOCOMPLETE_RECENT_SEARCHES,
            JSON.stringify(recentResultsSig.value),
        ),
    );

    const addToRecent = $((result: SearchResult) => {
        if (!recentResultsSig.value.find((el) => el.url === result.url)) {
            console.log(result);
            recentResultsSig.value = [...recentResultsSig.value, result];
            saveRecentSearches();
        }
    });

    const removeFromRecent = $((url: string) => {
        recentResultsSig.value = recentResultsSig.value.filter(
            (r) => r.url !== url,
        );
        saveRecentSearches();
    });

    useVisibleTask$(() => {
        recentResultsSig.value = JSON.parse(
            localStorage.getItem(AUTOCOMPLETE_RECENT_SEARCHES) || "[]",
        );
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
                                    onInput$={(_, t) =>
                                        searchWithDebounce(t.value)
                                    }
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

                            <div class="mt-4 space-y-2">
                                {recentResultsSig.value.map((item, key) => {
                                    const text =
                                        item.hierarchy.lvl3 ||
                                        item.hierarchy.lvl4 ||
                                        item.hierarchy.lvl5 ||
                                        item.hierarchy.lvl6;
                                    return (
                                        text && (
                                            <div key={key}>
                                                <div class="flex w-full items-center border-b-2 border-black py-2 align-middle text-black hover:opacity-80 dark:border-white dark:text-white">
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        class="h-8 w-8 fill-black pr-2 dark:fill-white"
                                                    >
                                                        <path d="M12.516 6.984v5.25l4.5 2.672-0.75 1.266-5.25-3.188v-6h1.5zM12 20.016q3.281 0 5.648-2.367t2.367-5.648-2.367-5.648-5.648-2.367-5.648 2.367-2.367 5.648 2.367 5.648 5.648 2.367zM12 2.016q4.125 0 7.055 2.93t2.93 7.055-2.93 7.055-7.055 2.93-7.055-2.93-2.93-7.055 2.93-7.055 7.055-2.93z"></path>
                                                    </svg>
                                                    <div>{text}</div>

                                                    <button
                                                        type="button"
                                                        title="Remove this search"
                                                        class="absolute right-4 px-4"
                                                        onClick$={() =>
                                                            removeFromRecent(
                                                                item.url,
                                                            )
                                                        }
                                                    >
                                                        <svg
                                                            viewBox="0 0 24 24"
                                                            class="h-6 w-6 fill-black opacity-80 dark:fill-white"
                                                        >
                                                            <path d="M18 7v13c0 0.276-0.111 0.525-0.293 0.707s-0.431 0.293-0.707 0.293h-10c-0.276 0-0.525-0.111-0.707-0.293s-0.293-0.431-0.293-0.707v-13zM17 5v-1c0-0.828-0.337-1.58-0.879-2.121s-1.293-0.879-2.121-0.879h-4c-0.828 0-1.58 0.337-2.121 0.879s-0.879 1.293-0.879 2.121v1h-4c-0.552 0-1 0.448-1 1s0.448 1 1 1h1v13c0 0.828 0.337 1.58 0.879 2.121s1.293 0.879 2.121 0.879h10c0.828 0 1.58-0.337 2.121-0.879s0.879-1.293 0.879-2.121v-13h1c0.552 0 1-0.448 1-1s-0.448-1-1-1zM9 5v-1c0-0.276 0.111-0.525 0.293-0.707s0.431-0.293 0.707-0.293h4c0.276 0 0.525 0.111 0.707 0.293s0.293 0.431 0.293 0.707v1zM9 11v6c0 0.552 0.448 1 1 1s1-0.448 1-1v-6c0-0.552-0.448-1-1-1s-1 0.448-1 1zM13 11v6c0 0.552 0.448 1 1 1s1-0.448 1-1v-6c0-0.552-0.448-1-1-1s-1 0.448-1 1z"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    );
                                })}
                                {
                                    docResultsSig.value.map((item, key) => {
                                        const text =
                                            item.hierarchy.lvl3 ||
                                            item.hierarchy.lvl4 ||
                                            item.hierarchy.lvl5 ||
                                            item.hierarchy.lvl6;
                                        return (
                                            text && (
                                                <div key={key}>
                                                    <div class="flex w-full items-center border-b-2 border-black py-2 align-middle text-black hover:opacity-80 dark:border-white dark:text-white">
                                                        <SearchIcon class="h-8 w-8 pr-2" />
                                                        <div
                                                            onClick$={() => {
                                                                addToRecent(
                                                                    item,
                                                                );
                                                                isOpenSig.value =
                                                                    false;

                                                                location.href = item.url
                                                            }}
                                                        >
                                                            {text}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        );
                                    })

                                    // ) : (
                                    //     <div class="py-12 text-center text-black dark:text-white">
                                    //         No results found for "
                                    //         {searchQuerySig.value}"
                                    //     </div>
                                    // )
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});
