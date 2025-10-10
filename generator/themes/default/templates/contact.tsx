export default function ContactTemplate({ meta, tokens, children }:{
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
          <h1 className="hero-title">
            {meta?.title || tokens?.copy?.contactHeroFallback || 'Contact Us'}
          </h1>
          <p className="hero-subtitle">
            {meta?.description || tokens?.copy?.contactSubtitle || ''}
          </p>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="content-section">
        <div className="content-container">
          <div className="content-text">
            <h2>{tokens?.copy?.contactHeading || 'Get in Touch'}</h2>
            <p className="content-subtitle">
              {tokens?.copy?.contactSubheading || 'Ready to get started? Contact us today.'}
            </p>
            <div className="contact-details">
              {tokens?.phone && (
                <div className="contact-item">
                  <h3>{tokens?.copy?.labelPhone || 'Phone'}</h3>
                  <a href={`tel:${tokens.phone.replace(/[^0-9]/g, '')}`} className="contact-link">
                    {tokens.phone}
                  </a>
                </div>
              )}
              {tokens?.email && (
                <div className="contact-item">
                  <h3>{tokens?.copy?.labelEmail || 'Email'}</h3>
                  <a href={`mailto:${tokens.email}`} className="contact-link">
                    {tokens.email}
                  </a>
                </div>
              )}
              {tokens?.serviceArea && (
                <div className="contact-item">
                  <h3>{tokens?.copy?.labelServiceAreas || 'Service Areas'}</h3>
                  <p>{tokens.serviceArea}</p>
                </div>
              )}
            </div>
            <div className="button-group">
              {tokens?.phone && (
                <a href={`tel:${tokens.phone.replace(/[^0-9]/g, '')}`} className="btn btn-primary">
                  {tokens?.copy?.contactButtonCall || 'Call Now'}
                </a>
              )}
              {tokens?.email && (
                <a href={`mailto:${tokens.email}`} className="btn btn-secondary">
                  {tokens?.copy?.contactButtonEmail || 'Email Us'}
                </a>
              )}
            </div>
          </div>
          {tokens?.images?.contactMain && (
            <div className="content-image">
              <div className="image-card">
                <img src={tokens.images.contactMain} alt="Contact us" />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Business Hours Section */}
      <section className="content-section content-section-alt">
        <div className="content-container">
          {tokens?.images?.contactHours && (
            <div className="content-image">
              <div className="image-card">
                <img src={tokens.images.contactHours} alt="Business hours" />
              </div>
            </div>
          )}
          <div className="content-text">
            <h2>{tokens?.copy?.contactHoursHeading || 'Business Hours'}</h2>
            <p className="content-subtitle">
              {tokens?.copy?.contactHoursSubtitle || 'We\'re here when you need us most.'}
            </p>
            <div className="hours-info">
              <div className="hours-item">
                <p className="hours-text">
                  <strong>{tokens?.hours?.days || 'Monday - Friday'}</strong><br />
                  {tokens?.hours?.time || '9:00 AM - 6:00 PM'}
                </p>
              </div>
              <p className="hours-note">
                {tokens?.hours?.note || 'Contact us to schedule an appointment'}
              </p>
            </div>
            <div className="button-group">
              <a href="/services" className="btn btn-primary">
                {tokens?.secondaryCta || 'View Services'}
              </a>
              <a href="/our-work" className="btn btn-secondary">
                See Our Work
              </a>
            </div>
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
    </>
  );
}

