import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { Founder } from "@lib/data/founders"

const VALUES = [
  {
    title: "Craft Over Shortcuts",
    text: "We'd rather make fewer pieces and make them right. Every piece in our catalogue, every stitch, from hand embroidery to premium handwork, every finish is something Manisha has personally stood behind before it reaches you.",
  },
  {
    title: "Your Budget Deserves Better",
    text: "Somewhere along the way, beautiful ethnic wear became either too expensive or too ordinary. We refuse to accept that. At SAHSHA, your money goes into the garment, we price our collections so that quality is never a compromise you have to make.",
  },
  {
    title: "Designed For Your Real Life",
    text: "Not for runways. Not for lookbooks. For your cousin's wedding, Monday at your office day or your quiet evening out, & festive collections we got you covered. For Real occasions. Real women. Real fit.",
  },
  {
    title: "We're Here & Actually Here",
    text: "Most brands disappear after the order ships. We don't. Manisha and Sahil are reachable, responsive, and genuinely invested in whether you loved what you received. That's not a customer service policy, that's just who we are.",
  },
]

function Stitch({ tone = "accent" }: { tone?: "accent" | "muted" }) {
  return (
    <div className={`about-page__stitch about-page__stitch--${tone}`} aria-hidden>
      <svg viewBox="0 0 1200 22" preserveAspectRatio="none">
        <line
          x1="0"
          y1="11"
          x2="1200"
          y2="11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="14 10"
        />
      </svg>
    </div>
  )
}

type AboutTemplateProps = {
  founderPhoto: string
  founders: Founder[]
}

export default function AboutTemplate({
  founderPhoto,
  founders,
}: AboutTemplateProps) {
  const founderPhotoAlt =
    founders.length > 0
      ? `SAHSHA founders — ${founders.map((f) => f.name).join(" & ")}`
      : "SAHSHA founders"

  return (
    <div className="about-page min-h-screen">
      <div className="about-page__container">
        <nav className="about-page__breadcrumb" aria-label="Breadcrumb">
          <LocalizedClientLink href="/">Home</LocalizedClientLink>
          <span aria-hidden>/</span>
          <span>About</span>
        </nav>

        <header className="about-page__hero">
          <div className="about-page__hero-meta">
            <span className="about-page__hero-line" aria-hidden />
            <p className="about-page__eyebrow">About Us</p>
            <span className="about-page__hero-line about-page__hero-line--grow" aria-hidden />
          </div>
          <h1 className="about-page__title">
            You Deserve To Look Beautiful —{" "}
            <em className="about-page__title-em">Without The Compromise.</em>
          </h1>
          <p className="about-page__lead">
            You&apos;ve been there. Spending an entire weekend going store to
            store, trying outfit after outfit, only to get home and realise
            nothing felt quite right. Too expensive for what it was. Wrong fit.
            Designs that looked stunning on the hanger but fell flat the moment
            you put them on. And somehow, you still have a wedding to attend next
            weekend and nothing to wear.
          </p>
          <p className="about-page__lead about-page__lead--emphasis">
            We built SAHSHA because we&apos;ve watched this happen, and we know
            it didn&apos;t have to.
          </p>
        </header>
      </div>

      <Stitch tone="accent" />

      <section className="about-page__section" aria-labelledby="about-story-heading">
        <div className="about-page__container">
          <p className="about-page__eyebrow">Our Story</p>
          <h2 id="about-story-heading" className="about-page__section-title">
            Our Story
          </h2>

          <div className="about-page__story-grid">
            <div className="about-page__story-copy">
              <p className="about-page__text">
                SAHSHA was born from a simple but powerful idea: that every
                woman, especially the working woman who barely has time to
                breathe, deserves access to beautiful, well-crafted ethnic wear
                without burning a hole in her pocket or spending her weekend
                hunting for it.
              </p>
              <p className="about-page__text">
                What started as a brother-sister passion project at local
                exhibitions quickly became something much larger than we
                anticipated. The love, trust, and warmth shown by our early
                customers told us everything we needed to know, that this
                wasn&apos;t just a business, it was something women genuinely
                needed. That response is what gave us the courage and conviction
                to bring SAHSHA online, and into the hands of women across India.
              </p>
            </div>
            <aside className="about-page__name-origin">
              The name SAHSHA is us — SAHil and maniSHA — two siblings, one
              shared vision.
            </aside>
          </div>
        </div>
      </section>

      <Stitch tone="muted" />

      <section
        className="about-page__section about-page__section--alt"
        aria-labelledby="about-founders-heading"
      >
        <div className="about-page__container">
          <p className="about-page__eyebrow">The Founders</p>
          <h2 id="about-founders-heading" className="about-page__section-title">
            The Founders
          </h2>

          <div className="about-page__founder-card">
            <figure className="about-page__founder-photo">
              <Image
                src={founderPhoto}
                alt={founderPhotoAlt}
                fill
                className="about-page__founder-photo-img"
                sizes="(max-width: 900px) 100vw, 400px"
                priority
              />
            </figure>

            <div className="about-page__founder-info">
              {founders.map((founder, index) => (
                <article key={founder.name} className="about-page__founder">
                  {index > 0 && <div className="about-page__founder-divider" />}
                  <h3 className="about-page__founder-name">{founder.name}</h3>
                  <span className="about-page__founder-role">{founder.role}</span>
                  <p className="about-page__text">{founder.bio}</p>
                </article>
              ))}
              <p className="about-page__text about-page__founders-note">
                Together, we don&apos;t just run a brand. If you ever need us, or
                really need us, we&apos;re a call or an email away. Neither a
                chatbot, nor a ticket number it will be us.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Stitch tone="accent" />

      <section
        className="about-page__section about-page__section--deep"
        aria-labelledby="about-values-heading"
      >
        <div className="about-page__container">
          <p className="about-page__eyebrow about-page__eyebrow--on-dark">
            What We Stand For
          </p>
          <h2 id="about-values-heading" className="about-page__section-title">
            What We Stand For
          </h2>

          <ul className="about-page__pillars">
            {VALUES.map((item, index) => (
              <li key={item.title} className="about-page__pillar">
                <span className="about-page__pillar-index" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="about-page__pillar-title">{item.title}</h3>
                <p className="about-page__pillar-text">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="about-page__section"
        aria-labelledby="about-audience-heading"
      >
        <div className="about-page__container about-page__narrow">
          <p className="about-page__eyebrow">Who We Design For</p>
          <h2 id="about-audience-heading" className="about-page__section-title">
            Who We Design For
          </h2>
          <p className="about-page__text">
            SAHSHA is for the woman who loves her culture but lives a
            contemporary life. She shops for everyday elegance, festive moments,
            and everything in between — and she refuses to choose between looking
            good and being practical.
          </p>
          <p className="about-page__text">
            If you&apos;re looking for kurtas that take you from desk to dinner,
            co-ord sets that feel as good as they look, or festive Indo-western
            pieces that turn heads at every occasion — you&apos;re exactly who we
            had in mind when we built this.
          </p>
        </div>
      </section>

      <Stitch tone="muted" />

      <section
        className="about-page__section about-page__section--alt"
        aria-labelledby="about-collections-heading"
      >
        <div className="about-page__container about-page__narrow">
          <p className="about-page__eyebrow">Our Collections</p>
          <h2
            id="about-collections-heading"
            className="about-page__section-title"
          >
            Our Collections
          </h2>
          <p className="about-page__text">
            From Everyday Essentials and Modern Ethnic to Festive Wear and
            Indo-Westerns — every collection at SAHSHA is curated with intention,
            crafted with care, and designed to make you feel like the most
            beautiful version of yourself, every single time.
          </p>
        </div>
      </section>

      <section
        className="about-page__section about-page__promise"
        aria-labelledby="about-promise-heading"
      >
        <div className="about-page__container about-page__promise-inner">
          <p className="about-page__eyebrow">Our Promise To You</p>
          <h2 id="about-promise-heading" className="about-page__section-title">
            Our Promise To You
          </h2>
          <p className="about-page__text">
            We don&apos;t just create designs — we want to give you the best
            experience in ethnic wear. Every minute you spend with SAHSHA, every
            rupee you invest in our pieces, every bit of trust you place in us —
            we take that seriously. That is our promise to you, and it is one we
            intend to keep with every order we pack and every collection we
            launch.
          </p>
          <p className="about-page__welcome">
            Welcome to SAHSHA. We&apos;re glad you&apos;re here.
          </p>
          <LocalizedClientLink href="/collections" className="about-page__cta">
            Explore Our Collections
          </LocalizedClientLink>
        </div>
      </section>
    </div>
  )
}
