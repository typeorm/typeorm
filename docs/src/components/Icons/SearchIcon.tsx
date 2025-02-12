import { component$ } from "@qwik.dev/core";

export const SearchIcon = component$(({ class: _class = '' }: { class?: string }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class={`h-6 w-6 ${_class}`}
        >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
        </svg>
    );
});
