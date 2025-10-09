export function Hero({ 
  title, 
  subtitle, 
  image, 
  cta 
}: { 
  title: string; 
  subtitle?: string; 
  image?: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="hero" style={{
      backgroundImage: image ? `linear-gradient(rgba(14, 165, 233, 0.9), rgba(2, 132, 199, 0.9)), url(${image})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <div className="container" style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          marginBottom: '24px', 
          color: 'white',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ 
            fontSize: '1.25rem', 
            marginBottom: '32px', 
            color: 'rgba(255,255,255,0.95)',
            maxWidth: '600px',
            margin: '0 auto 32px'
          }}>
            {subtitle}
          </p>
        )}
        {cta && (
          <a href={cta.href} className="btn-primary" style={{
            display: 'inline-block',
            padding: '16px 48px',
            fontSize: '1.125rem',
            background: 'white',
            color: 'var(--primary)',
            marginTop: '16px'
          }}>
            {cta.label}
          </a>
        )}
      </div>
    </div>
  );
}




