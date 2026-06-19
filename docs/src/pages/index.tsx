import type { ReactNode, ElementType } from "react"
import React from "react"
import clsx from "clsx"
import Link from "@docusaurus/Link"
import useDocusaurusContext from "@docusaurus/useDocusaurusContext"
import Layout from "@theme/Layout"
import Heading from "@theme/Heading"
import CodeBlock from "@theme/CodeBlock"
import {
    Settings,
    FileCode,
    Database,
    Search,
    Rocket,
    Globe,
    Monitor,
    Smartphone,
    Atom,
    AppWindow,
} from "lucide-react"

import { databases } from "@site/src/constants/databases"

import maintainers from "./maintainers.json"
import styles from "./index.module.css"

// Feature section data
const features = [
    {
        title: "Flexible Patterns",
        description:
            "Supports both DataMapper and ActiveRecord patterns, giving you the flexibility to choose what works best for your project.",
        icon: Settings,
    },
    {
        title: "TypeScript First",
        description:
            "Built from the ground up with TypeScript support, providing complete type safety for your database models.",
        icon: FileCode,
    },
    {
        title: "Multi-Database Support",
        description:
            "Works with MySQL, PostgreSQL, MariaDB, SQLite, MS SQL Server, Oracle, MongoDB, and more.",
        icon: Database,
    },
    {
        title: "Powerful QueryBuilder",
        description:
            "Elegant syntax for building complex queries with joins, pagination, and caching.",
        icon: Search,
    },
    {
        title: "Migrations & Schema",
        description:
            "First-class support for database migrations with automatic generation.",
        icon: Rocket,
    },
    {
        title: "Cross-Platform",
        description:
            "Works in Node.js, browsers, mobile, and desktop applications.",
        icon: Globe,
    },
]

// Code examples for tabs
const codeExamples = {
    entity: `import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    age: number
}`,
    dataMapper: `// Data Mapper approach
const userRepository = dataSource.getRepository(User)

// Create and save a user
const user = new User()
user.firstName = "Timber"
user.lastName = "Saw"
user.age = 25
await userRepository.save(user)

// Find all users
const allUsers = await userRepository.find()

// Find user by ID
const user = await userRepository.findOneBy({ id: 1 })`,
    activeRecord: `// Active Record approach
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string
}

// Create and save
const user = new User()
user.firstName = "Timber"
user.lastName = "Saw"
await user.save()

// Find all users
const users = await User.find()

// Find specific user
const user = await User.findOneBy({ firstName: "Timber" })`,
}

function HomepageHeader() {
    const { siteConfig } = useDocusaurusContext()
    return (
        <header className={clsx("hero hero--primary", styles.heroBanner)}>
            <div className="container">
                <div className={styles.heroContent}>
                    <div className={styles.heroText}>
                        <Heading as="h1" className="hero__title">
                            {siteConfig.title}
                        </Heading>
                        <p className="hero__subtitle">{siteConfig.tagline}</p>
                        <div className={styles.buttons}>
                            <Link
                                className="button button--secondary button--lg"
                                to="/docs/getting-started"
                            >
                                Get Started
                            </Link>
                            <Link
                                className="button button--outline button--lg"
                                href="https://github.com/typeorm/typeorm"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View on GitHub
                            </Link>
                        </div>
                    </div>
                    <div className={styles.heroImage}>
                        <img
                            src="/img/typeorm-logo-white.svg"
                            alt="TypeORM Logo"
                        />
                    </div>
                </div>
            </div>
        </header>
    )
}

function Feature({
    title,
    description,
    icon: Icon,
}: {
    title: string
    description: string
    icon: ElementType
}) {
    return (
        <div className={clsx("col col--4", styles.featureItem)}>
            <div className={styles.featureIcon}>
                <Icon size={32} strokeWidth={1.5} />
            </div>
            <div className={styles.featureContent}>
                <Heading as="h3">{title}</Heading>
                <p>{description}</p>
            </div>
        </div>
    )
}

function HomepageFeatures() {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className="row">
                    {features.map((props, idx) => (
                        <Feature key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    )
}

function CodeExampleSection() {
    const [activeTab, setActiveTab] = React.useState("entity")

    const handleTabClick = (tab) => {
        setActiveTab(tab)
    }

    return (
        <section className={styles.codeExampleSection}>
            <div className="container">
                <div className={styles.codeExampleContent}>
                    <div className={styles.codeExampleText}>
                        <Heading as="h2">Elegant, Type-Safe API</Heading>
                        <p>
                            TypeORM provides a beautiful, simple API for
                            interacting with your database that takes full
                            advantage of TypeScript's type system. Choose
                            between DataMapper and ActiveRecord patterns - both
                            are fully supported.
                        </p>
                        <div className={styles.codeTabs}>
                            <div className={styles.codeTabHeader}>
                                <div
                                    className={clsx(
                                        activeTab === "entity" &&
                                            styles.codeTabActive,
                                    )}
                                    onClick={() => handleTabClick("entity")}
                                >
                                    Entity Definition
                                </div>
                                <div
                                    className={clsx(
                                        activeTab === "dataMapper" &&
                                            styles.codeTabActive,
                                    )}
                                    onClick={() => handleTabClick("dataMapper")}
                                >
                                    Data Mapper
                                </div>
                                <div
                                    className={clsx(
                                        activeTab === "activeRecord" &&
                                            styles.codeTabActive,
                                    )}
                                    onClick={() =>
                                        handleTabClick("activeRecord")
                                    }
                                >
                                    Active Record
                                </div>
                            </div>
                            <div className={styles.codeTabContent}>
                                <CodeBlock language="typescript">
                                    {codeExamples[activeTab]}
                                </CodeBlock>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function SupportedDatabases() {
    return (
        <section className={styles.databasesSection}>
            <div className="container">
                <Heading as="h2" className={styles.sectionTitle}>
                    Supported Databases
                </Heading>
                <div className={styles.databasesGrid}>
                    {Object.values(databases).map((db) => (
                        <div key={db.label} className={styles.databaseItem}>
                            <div className={styles.databaseLogo}>
                                <img src={db.icon} alt={`${db.label} logo`} />
                            </div>
                            <span className={styles.databaseName}>
                                {db.label}
                            </span>
                        </div>
                    ))}
                </div>
                <p className={styles.databasesDisclaimer}>
                    All logos are trademarks of their respective owners, used
                    for identification purposes only.
                </p>
            </div>
        </section>
    )
}

const platforms = [
    { name: "NodeJS", icon: Monitor },
    { name: "Browser", icon: Globe },
    { name: "Mobile", icon: Smartphone },
    { name: "React Native", icon: Atom },
    { name: "Electron", icon: AppWindow },
]

function PlatformsSection() {
    return (
        <section className={styles.platformsSection}>
            <div className="container">
                <Heading as="h2" className={styles.sectionTitle}>
                    Works Everywhere
                </Heading>
                <p className={styles.platformsDescription}>
                    TypeORM runs in NodeJS, Browser, Cordova, Ionic, React
                    Native, NativeScript, Expo, and Electron platforms.
                </p>
                <div className={styles.platformsIcons}>
                    {platforms.map((p) => (
                        <span key={p.name}>
                            <p.icon size={18} strokeWidth={1.5} /> {p.name}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    )
}

function MaintainersSection() {
    return (
        <section className={styles.maintainersSection}>
            <div className="container">
                <Heading as="h2" className={styles.sectionTitle}>
                    Maintained By
                </Heading>
                <div className={styles.maintainersAvatars}>
                    {maintainers.map((m) => (
                        <img
                            key={m.github}
                            src={`https://avatars.githubusercontent.com/${m.github}?s=100`}
                            alt={m.name}
                            title={m.name}
                            className={styles.maintainerAvatar}
                            loading="lazy"
                        />
                    ))}
                </div>
                <Link
                    className="button button--primary button--md"
                    to="/maintainers"
                >
                    Meet the Team
                </Link>
            </div>
        </section>
    )
}

function CallToAction() {
    return (
        <section className={styles.ctaSection}>
            <div className="container">
                <Heading as="h2">Ready to Get Started?</Heading>
                <p>
                    TypeORM makes database interaction a breeze. Join thousands
                    of developers who are already building better applications
                    with TypeORM.
                </p>
                <div className={styles.ctaButtons}>
                    <Link
                        className={clsx(
                            "button button--secondary button--lg margin-right--md",
                            styles.noHorizontalMarginTablet,
                        )}
                        to="/docs/getting-started"
                    >
                        Read the Docs
                    </Link>
                    <Link
                        className="button button--outline button--lg"
                        href="https://github.com/typeorm/typeorm"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Star on GitHub
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default function Home(): ReactNode {
    const { siteConfig } = useDocusaurusContext()
    return (
        <Layout
            title={`${siteConfig.title} - ${siteConfig.tagline}`}
            description="TypeORM is an ORM that can run in NodeJS, Browser, Cordova, Ionic, React Native, NativeScript, Expo, and Electron platforms and can be used with TypeScript and JavaScript."
        >
            <HomepageHeader />
            <main>
                <HomepageFeatures />
                <CodeExampleSection />
                <SupportedDatabases />
                <PlatformsSection />
                <MaintainersSection />
                <CallToAction />
            </main>
        </Layout>
    )
}
