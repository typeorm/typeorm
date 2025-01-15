import { component$ } from "@qwik.dev/core";

export const CloseIcon = component$(() => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-10 w-10 rounded-xl stroke-black p-1 dark:stroke-white"
      fill="none"
      stroke-width="2.5"
      viewBox="0 0 24 24"
      aria-label="Close"
    >
      <path
        d="M6 18L18 6M6 6l12 12"
        stroke-linecap="round"
        stroke-linejoin="round"
      ></path>
    </svg>
  );
});
