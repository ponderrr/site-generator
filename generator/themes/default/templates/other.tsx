export default function OtherTemplate({ meta, tokens, children }:{
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
          <h1 className="hero-title">{meta?.title || 'Our Work'}</h1>
          <p className="hero-subtitle">{meta?.description || 'See the quality of our professional cleaning services'}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="prose animate-fade-in-up" style={{ 
            maxWidth: '900px', 
            margin: '0 auto'
          }}>
            {children}
          </div>
          
          <div className="card animate-fade-in-up" style={{ 
            marginTop: '64px', 
            textAlign: 'center',
            background: 'linear-gradient(135deg, var(--bg-light) 0%, rgba(14, 165, 233, 0.05) 100%)',
            border: '2px dashed var(--primary)',
            animationDelay: '0.2s'
          }}>
            <p style={{ color: 'var(--text-light)', fontStyle: 'italic', margin: 0, fontSize: '1rem' }}>
              📸 Images in the content above will display in a gallery format. Placeholder images are marked with notes.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-alt" style={{ textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '2.5rem', marginBottom: '24px', color: 'var(--text)' }} className="animate-fade-in-up">Impressed by Our Work?</h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-light)', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }} className="animate-fade-in-up">
            Let us transform your property with our professional cleaning services
          </p>
          <a href="/contact" className="btn-primary animate-fade-in-up">
            Get Your Free Quote
          </a>
        </div>
      </section>
    </>
  );
}

