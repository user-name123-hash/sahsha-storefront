import Image from "next/image"

type SocialLink = {
  name: string
  url: string
  icon: string | null
}

type FooterSocialProps = {
  links: SocialLink[]
}

export default function FooterSocial({ links }: FooterSocialProps) {
  if (!links.length) return null

  return (
    <div className="site-footer__social">
      {links.map((link) => (
        <a
          key={`${link.name}-${link.url}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          data-ga-event="social_click"
          data-ga-label={link.name}
          className="site-footer__social-link"
          aria-label={link.name}
        >
          {link.icon ? (
            <Image
              src={link.icon}
              alt={link.name}
              width={36}
              height={36}
              className="site-footer__social-icon"
            />
          ) : (
            <span className="site-footer__social-fallback">
              {link.name.substring(0, 2)}
            </span>
          )}
        </a>
      ))}
    </div>
  )
}
