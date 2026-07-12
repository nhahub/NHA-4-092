import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faWandMagicSparkles,
    faListCheck,
    faStopwatch,
    faChartLine,
    faLayerGroup,
    faRoute,
    faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

import AppLogo from "../components/layout/AppLogo";
import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Ripple from "../components/landing/Ripple";
import AuroraText from "../components/landing/AuroraText";
import ContainerTextFlip from "../components/landing/ContainerTextFlip";
import TypingText from "../components/landing/TypingText";
import TextAnimate from "../components/landing/TextAnimate";
import "./Landing.css";

const roleWords = [
    "Frontend Developer",
    "Data Analyst",
    "UX Designer",
    "ML Engineer",
];

const goalTypingExamples = [
    "Learn Web Development",
    "Data Science career path",
    "UX Design portfolio projects",
];

const features = [
    {
        icon: faWandMagicSparkles,
        title: "AI-generated roadmaps",
        body: "Tell Rhodes what you're chasing and it lays out a phase-by-phase plan built specifically for that goal — no generic templates.",
    },
    {
        icon: faLayerGroup,
        title: "Three ways to grow",
        body: "Learn a subject from scratch, follow a career path toward a role, or build portfolio projects — each with its own roadmap.",
    },
    {
        icon: faListCheck,
        title: "Weekly tasks that fit your pace",
        body: "Tell us how many hours a week you've got. Rhodes paces every phase and lesson to match, not the other way around.",
    },
    {
        icon: faStopwatch,
        title: "Focus mode",
        body: "A distraction-free timer for deep work sessions, tracked automatically against the lesson you're working through.",
    },
    {
        icon: faChartLine,
        title: "Real progress, tracked",
        body: "Streaks, completion history, and a dashboard that shows what you've actually done — not just what's left.",
    },
    {
        icon: faRoute,
        title: "Builds on what you know",
        body: "Move from Beginner to Intermediate on the same goal and Rhodes already knows which skills to skip and which to build on.",
    },
];

const steps = [
    {
        n: "01",
        title: "Pick a goal",
        body: "Type what you want to learn, and choose to learn it, work toward a career, or build a portfolio.",
    },
    {
        n: "02",
        title: "Set your pace",
        body: "Tell Rhodes how many hours a week you can realistically commit.",
    },
    {
        n: "03",
        title: "Get your roadmap",
        body: "A phased plan with lessons, objectives, and resources — ready the moment you land on your dashboard.",
    },
];

export default function Landing() {
    return (
        <div className="landing">
            <Navbar variant="landing" />

            {/* HERO */}
            <section className="landing-hero">
                <Ripple />

                <div className="landing-hero-inner">
                    <span className="landing-eyebrow">AI-powered learning roadmaps</span>

                    <h1 className="landing-hero-title">
                        Every goal has a <AuroraText>road</AuroraText>.
                        <br />
                        Rhodes builds yours.
                    </h1>

                    <p className="landing-hero-sub">
                        Become a <ContainerTextFlip words={roleWords} /> — with a roadmap
                        generated for exactly that goal, paced to exactly your schedule.
                    </p>

                    <div className="landing-hero-actions">
                        <Link to="/signup">
                            <Button>
                                Build my roadmap <FontAwesomeIcon icon={faArrowRight} />
                            </Button>
                        </Link>

                        <a
                            href="#how"
                            onClick={(event) => {
                                event.preventDefault();

                                document.getElementById("how")?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                });
                            }}
                        >
                            <Button variant="secondary">See how it works</Button>
                        </a>
                    </div>

                    <div className="landing-hero-mock">
                        <Card className="landing-mock-card">
                            <div className="landing-mock-input">
                                <span className="landing-mock-dot" />
                                <TypingText texts={goalTypingExamples} />
                            </div>

                            <div className="landing-mock-arrow">
                                <FontAwesomeIcon icon={faArrowRight} />
                            </div>

                            <div className="landing-mock-phases">
                                <div className="landing-mock-phase">
                                    <span className="landing-mock-phase-index">1</span>
                                    Foundations &amp; Setup
                                </div>

                                <div className="landing-mock-phase">
                                    <span className="landing-mock-phase-index">2</span>
                                    Hands-On Practice
                                </div>

                                <div className="landing-mock-phase">
                                    <span className="landing-mock-phase-index">3</span>
                                    Portfolio-Ready Project
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="landing-section">
                <TextAnimate as="h2" className="landing-section-title">
                    What Rhodes does
                </TextAnimate>

                <p className="landing-section-sub">
                    Everything you need to go from "I want to learn this" to actually
                    learning it.
                </p>

                <div className="landing-feature-grid">
                    {features.map((feature) => (
                        <Card key={feature.title} className="landing-feature-card">
                            <div className="landing-feature-icon">
                                <FontAwesomeIcon icon={feature.icon} />
                            </div>

                            <h3>{feature.title}</h3>
                            <p>{feature.body}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* WHY RHODES */}
            <section id="why" className="landing-section landing-why">
                <TextAnimate as="h2" className="landing-section-title">
                    Why Rhodes
                </TextAnimate>

                <div className="landing-why-grid">
                    <div className="landing-why-row">
                        <span className="landing-why-index">01</span>

                        <div>
                            <h3>Not another generic course list</h3>
                            <p>
                                Roadmaps are generated specifically for your goal, your
                                category, and your skill level — not pulled from a static
                                template shared by everyone else.
                            </p>
                        </div>
                    </div>

                    <div className="landing-why-row">
                        <span className="landing-why-index">02</span>

                        <div>
                            <h3>Picks up where you left off</h3>
                            <p>
                                Finished the beginner roadmap for a goal? Generate the
                                intermediate one and Rhodes already accounts for the skills
                                you built — no repeated lessons.
                            </p>
                        </div>
                    </div>

                    <div className="landing-why-row">
                        <span className="landing-why-index">03</span>

                        <div>
                            <h3>Paced to your real life</h3>
                            <p>
                                Roadmaps are shaped around the hours you actually have each
                                week, not an idealized full-time study schedule.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how" className="landing-section">
                <TextAnimate as="h2" className="landing-section-title">
                    How it works
                </TextAnimate>

                <div className="landing-steps">
                    {steps.map((step) => (
                        <div key={step.n} className="landing-step">
                            <span className="landing-step-n">{step.n}</span>
                            <h3>{step.title}</h3>
                            <p>{step.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="landing-cta">
                <Ripple rings={3} className="landing-cta-ripple" />

                <div className="landing-cta-inner">
                    <h2>
                        Ready to build your <AuroraText>road</AuroraText>?
                    </h2>

                    <p>It takes about two minutes to get your first roadmap.</p>

                    <Link to="/signup">
                        <Button>
                            Get started free <FontAwesomeIcon icon={faArrowRight} />
                        </Button>
                    </Link>
                </div>
            </section>

            <footer className="landing-footer">
                <AppLogo size={26} />

                <span className="landing-footer-copy">
          © {new Date().getFullYear()} Rhodes. Every goal has a road.
        </span>
            </footer>
        </div>
    );
}