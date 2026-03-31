import type { ReactNode } from "react"
import React from "react"
import Layout from "@theme/Layout"
import Heading from "@theme/Heading"
import Link from "@docusaurus/Link"

import styles from "./maintainers.module.css"

const maintainers = [
    {
        name: "Michael Bromley",
        github: "michaelbromley",
        role: "Steering, Technical Liaison",
    },
    {
        name: "David Höck",
        github: "dlhck",
        role: "Steering, External Relations",
    },
    {
        name: "Lucian Mocanu",
        github: "alumni",
        role: "Technical Lead",
    },
    {
        name: "Naor Peled",
        github: "naorpeled",
        role: "Maintainer",
    },
    {
        name: "Giorgio Boa",
        github: "gioboa",
        role: "Maintainer",
    },
    {
        name: "Piotr Kuczynski",
        github: "pkuczynski",
        role: "Maintainer",
    },
    {
        name: "Mohammed Gomaa",
        github: "G0maa",
        role: "Maintainer",
    },
    {
        name: "Julian Pufler",
        github: "pujux",
        role: "Maintainer",
    },
    {
        name: "Simon Garner",
        github: "sgarner",
        role: "Maintainer",
    },
    {
        name: "Pieter Wigboldus",
        github: "w3nl",
        role: "Maintainer",
    },
    {
        name: "Mike Guida",
        github: "mguida22",
        role: "Maintainer",
    },
]

function MaintainerCard({ name, github, role }) {
    return (
        <Link
            href={`https://github.com/${github}`}
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
        >
            <img
                src={`https://avatars.githubusercontent.com/${github}?s=150`}
                alt={name}
                className={styles.avatar}
                loading="lazy"
            />
            <div className={styles.cardInfo}>
                <span className={styles.cardName}>{name}</span>
                <span className={styles.cardRole}>{role}</span>
            </div>
        </Link>
    )
}

export default function Maintainers(): ReactNode {
    return (
        <Layout title="Maintainers" description="Meet the team behind TypeORM">
            <header className={styles.heroBanner}>
                <div className="container">
                    <Heading as="h1">Maintainers</Heading>
                    <p className={styles.heroSubtitle}>
                        TypeORM was originally created by{" "}
                        <Link
                            href="https://github.com/pleerock"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Umed Khudoiberdiev
                        </Link>{" "}
                        in 2016. In late 2024, maintenance was passed to David
                        Höck and Michael Bromley, who then put together the
                        current maintainer team to ensure the long-term health
                        and growth of the project.
                    </p>
                </div>
            </header>
            <main>
                <section className={styles.teamSection}>
                    <div className="container">
                        <div className={styles.grid}>
                            {maintainers.map((m) => (
                                <MaintainerCard key={m.github} {...m} />
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </Layout>
    )
}
