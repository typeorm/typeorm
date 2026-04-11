import type { PropsWithChildren, ReactNode } from "react"
import React from "react"
import Layout from "@theme/Layout"
import Heading from "@theme/Heading"
import Link from "@docusaurus/Link"
import { GitHubIcon } from "../components/icons/github-icon"
import { LinkedInIcon } from "../components/icons/linkedin-icon"
import styles from "./maintainers.module.css"
import maintainers from "./maintainers.json"

type Maintainer = (typeof maintainers)[number]

const SocialLink = ({
    href,
    title,
    className,
    children,
}: PropsWithChildren<{
    href: string
    title?: string
    className?: string
    children: ReactNode
}>) => (
    <Link
        href={href}
        target="_blank"
        rel="noopener"
        title={title}
        aria-label={title}
        className={className}
    >
        {children}
    </Link>
)

const MaintainerCard = ({ name, github, role, linkedin }: Maintainer) => {
    const profileUrl = linkedin || `https://github.com/${github}`
    return (
        <div className={styles.card}>
            <SocialLink href={profileUrl}>
                <img
                    src={`https://avatars.githubusercontent.com/${github}?s=150`}
                    alt={name}
                    className={styles.avatar}
                    loading="lazy"
                />
            </SocialLink>

            <div className={styles.cardInfo}>
                <SocialLink href={profileUrl} className={styles.cardName}>
                    {name}
                </SocialLink>

                <span className={styles.cardRole}>{role}</span>

                <div className={styles.socialLinks}>
                    <SocialLink
                        href={`https://github.com/${github}`}
                        title="GitHub"
                    >
                        <GitHubIcon />
                    </SocialLink>
                    {linkedin && (
                        <SocialLink href={linkedin} title="LinkedIn">
                            <LinkedInIcon />
                        </SocialLink>
                    )}
                </div>
            </div>
        </div>
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
                            rel="noopener"
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
                            {maintainers.map(({ github, ...rest }) => (
                                <MaintainerCard
                                    key={github}
                                    github={github}
                                    {...rest}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </Layout>
    )
}
