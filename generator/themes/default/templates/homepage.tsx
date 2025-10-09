export default function HomepageTemplate({ meta, tokens, children }:{
  meta: { title?: string; description?: string; page_type?: string },
  tokens: any,
  children: React.ReactNode
}) {
  return (
    <>
      {/* Modern Hero with overlay text */}
      <section className="modern-hero">
        <div className="hero-overlay">
          <div className="hero-content">
            <h1 className="hero-title">{meta.title || tokens?.brandName || "Welcome"}</h1>
            <p className="hero-subtitle">{tokens?.tagline || "Professional services for your needs"}</p>
            <a href="/contact" className="hero-cta">
              {tokens?.primaryCta || "Get Started"}
            </a>
          </div>
        </div>
      </section>
      
      {/* AI-generated content */}
      <section className="content-section">
        <div className="content-container">
          <div className="content-text full-width">
            <article className="prose prose-lg">
              {children}
            </article>
          </div>
        </div>
      </section>

      {/* Simple CTA section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Get in touch today for a free consultation</p>
            <a href="/contact" className="btn btn-primary">
              {tokens?.primaryCta || "Contact Us"}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

