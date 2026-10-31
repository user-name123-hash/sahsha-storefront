type ContentPageHeroProps = {
  eyebrow: string
  title: string
  lead: string
}

export default function ContentPageHero({
  eyebrow,
  title,
  lead,
}: ContentPageHeroProps) {
  return (
    <header className="content-page-hero">
      <div className="content-page-hero__meta">
        <span className="content-page-hero__line" aria-hidden />
        <p className="content-page-hero__eyebrow">{eyebrow}</p>
        <span className="content-page-hero__line content-page-hero__line--grow" aria-hidden />
      </div>
      <h1 className="content-page-hero__title">{title}</h1>
      <p className="content-page-hero__lead">{lead}</p>
    </header>
  )
}
