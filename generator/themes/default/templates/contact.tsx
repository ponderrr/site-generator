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
          <h1 className="hero-title">{meta?.title || 'Contact Us'}</h1>
          <p className="hero-subtitle">{meta?.description || 'Get in touch for a free quote'}</p>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="content-section">
        <div className="content-container">
          <div className="content-text">
            <h2>Get in Touch</h2>
            <p className="content-subtitle">Ready to get started? Contact us today for a free quote.</p>
            <div className="contact-details">
              {tokens?.phone && (
                <div className="contact-item">
                  <h3>Phone</h3>
                  <a href={`tel:${tokens.phone.replace(/[^0-9]/g, '')}`} className="contact-link">
                    {tokens.phone}
                  </a>
                </div>
              )}
              {tokens?.email && (
                <div className="contact-item">
                  <h3>Email</h3>
                  <a href={`mailto:${tokens.email}`} className="contact-link">
                    {tokens.email}
                  </a>
                </div>
              )}
              {tokens?.serviceArea && (
                <div className="contact-item">
                  <h3>Service Areas</h3>
                  <p>{tokens.serviceArea}</p>
                </div>
              )}
            </div>
            <div className="button-group">
              {tokens?.phone && (
                <a href={`tel:${tokens.phone.replace(/[^0-9]/g, '')}`} className="btn btn-primary">
                  Call Now
                </a>
              )}
              {tokens?.email && (
                <a href={`mailto:${tokens.email}`} className="btn btn-secondary">
                  Email Us
                </a>
              )}
            </div>
          </div>
          <div className="content-image">
            <div className="image-card">
              <img src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Contact us" />
            </div>
          </div>
        </div>
      </section>

      {/* Business Hours Section */}
      <section className="content-section content-section-alt">
        <div className="content-container">
          <div className="content-image">
            <div className="image-card">
              <img src="https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Business hours" />
            </div>
          </div>
          <div className="content-text">
            <h2>Business Hours</h2>
            <p className="content-subtitle">We're here when you need us most.</p>
            <div className="hours-info">
              <div className="hours-item">
                <p className="hours-text">
                  <strong>{tokens?.hours_days || 'Monday - Friday'}</strong><br />
                  {tokens?.hours_time || '9:00 AM - 6:00 PM'}
                </p>
              </div>
              <p className="hours-note">
                {tokens?.hours_note || 'Contact us to schedule an appointment'}
              </p>
            </div>
            <div className="button-group">
              <a href="/services" className="btn btn-primary">
                View Services
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

