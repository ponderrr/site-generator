export default function ServiceTemplate({ meta, tokens, children }:{
  meta: { title?: string; description?: string; page_type?: string },
  tokens: any,
  children: React.ReactNode
}) {
  return (
    <>
      {/* Modern Hero with title overlay */}
      <section className="page-hero">
        <div className="page-hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">{meta?.title || 'Our Services'}</h1>
          <p className="hero-subtitle">{meta?.description || 'Professional exterior cleaning services to keep your property looking its best'}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {/* AI-generated service content */}
          <div style={{ maxWidth: '900px', margin: '0 auto' }} className="prose animate-fade-in-up">
            {children}
          </div>
        </div>
      </section>

      <section className="section section-alt" style={{ textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '2.5rem', marginBottom: '24px', color: 'var(--text)' }} className="animate-fade-in-up">Ready to Get Started?</h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-light)', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }} className="animate-fade-in-up">
            Contact us today for a free quote on any of our services
          </p>
          <a href="/contact" className="btn-primary animate-fade-in-up">
            {tokens.primaryCta || "Get a Free Quote"}
          </a>
        </div>
      </section>
    </>
  );
}

