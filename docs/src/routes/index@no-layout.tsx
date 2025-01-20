import { component$ } from "@qwik.dev/core";

export default component$(() => {
    return (
        <div class="min-h-screen">
            {/* Hero Section */}
            <div class="container mx-auto px-4 py-20">
                <div class="text-center">
                    <h1 class="mb-6 text-6xl font-bold text-white">
                        TypeORM
                        <span class="text-blue-400"> for Node.js</span>
                    </h1>
                    <p class="mx-auto mb-8 max-w-2xl text-xl text-slate-300">
                        TypeORM for Node.js with clean object-oriented API,
                        identity map, unit of work and more.
                    </p>
                    <div class="flex justify-center gap-4">
                        <button class="flex items-center gap-2 rounded-lg bg-blue-500 px-8 py-3 font-semibold text-white hover:bg-blue-600">
                            Get Started
                        </button>
                        <button class="flex items-center gap-2 rounded-lg bg-slate-700 px-8 py-3 font-semibold text-white hover:bg-slate-600">
                            GitHub
                        </button>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div class="container mx-auto px-4 py-20">
                <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <FeatureCard
                        title="Schema Definition"
                        description="Define your schema using TypeScript classes with decorators, or use the EntitySchema helper."
                    />
                    <FeatureCard
                        title="Multiple Drivers"
                        description="Support for MySQL, PostgreSQL, SQLite, and MongoDB with clean abstraction layer."
                    />
                    <FeatureCard
                        title="Performance"
                        description="Optimized for performance with identity map, unit of work, and lazy loading."
                    />
                    <FeatureCard
                        title="Identity Map"
                        description="Automatic identity map ensures each entity is loaded only once."
                    />
                    <FeatureCard
                        title="Type Safety"
                        description="Full TypeScript support with strict types and autocompletion."
                    />
                    <FeatureCard
                        title="Open Source"
                        description="MIT licensed, with active community and regular updates."
                    />
                </div>
            </div>

            {/* Code Example */}
            <div class="container mx-auto px-4 py-20">
                <div class="rounded-xl bg-slate-800 p-8 shadow-2xl">
                    <pre class="overflow-x-auto text-sm text-slate-300">
                        <code>{`import { Entity, Property, PrimaryKey } from '@mikro-orm/core';
    
    @Entity()
    export class Book {
      @PrimaryKey()
      id!: number;
    
      @Property()
      title!: string;
    
      @Property()
      author!: string;
    
      @Property()
      createdAt = new Date();
    
      constructor(title: string, author: string) {
        this.title = title;
        this.author = author;
      }
    }`}</code>
                    </pre>
                </div>
            </div>

            {/* Stats Section */}
            <div class="container mx-auto px-4 py-20">
                <div class="grid gap-8 text-center md:grid-cols-3">
                    <StatCard num="15k+" label="Weekly Downloads" />
                    <StatCard num="6.5k+" label="GitHub Stars" />
                    <StatCard num="200+" label="Contributors" />
                </div>
            </div>

            {/* Footer */}
            <footer class="border-t border-slate-700 py-12">
                <div class="container mx-auto px-4 text-center text-slate-400">
                    <p>© 2025 TypeORM. MIT Licensed.</p>
                </div>
            </footer>
        </div>
    );
});

const FeatureCard = ({
    title,
    description,
}: {
    title: string;
    description: string;
}) => {
    return (
        <div class="rounded-xl bg-slate-800 p-6 transition-colors hover:bg-slate-700">
            <div class="mb-4 text-blue-400"></div>
            <h3 class="mb-2 text-xl font-semibold text-white">{title}</h3>
            <p class="text-slate-300">{description}</p>
        </div>
    );
};

const StatCard = ({ num, label }: { num: string; label: string }) => {
    return (
        <div class="rounded-xl bg-slate-800 p-6">
            <div class="mb-2 text-4xl font-bold text-blue-400">{num}</div>
            <div class="text-slate-300">{label}</div>
        </div>
    );
};
