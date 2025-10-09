import "./globals.css";
import tokens from "@themes/default/tokens";

export const metadata = {
  title: tokens.brandName,
  description: tokens.tagline
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="modern-nav">
          <div className="nav-container">
            <a href="/" className="nav-brand">
              {tokens.brandName}
            </a>
            <nav className="nav-links">
              <a href="/" className="nav-link">Home</a>
              <a href="/services" className="nav-link">Services</a>
              <a href="/our-work" className="nav-link">Our Work</a>
              <a href="/contact" className="nav-link">Contact</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer style={{ 
          background: tokens.colors.text, 
          color: 'white', 
          padding: '48px 24px',
          marginTop: '64px'
        }}>
          <div className="container">
            <div style={{ display: 'grid', gap: '32px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              <div>
                <h3 style={{ color: 'white', marginBottom: '16px' }}>{tokens.brandName}</h3>
                <p style={{ color: '#94a3b8' }}>{tokens.tagline}</p>
              </div>
              <div>
                <h4 style={{ color: 'white', marginBottom: '16px' }}>Quick Links</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a href="/" style={{ color: '#94a3b8' }}>Home</a>
                  <a href="/services" style={{ color: '#94a3b8' }}>Services</a>
                  <a href="/our-work" style={{ color: '#94a3b8' }}>Our Work</a>
                  <a href="/contact" style={{ color: '#94a3b8' }}>Contact</a>
                </div>
              </div>
              <div>
                <h4 style={{ color: 'white', marginBottom: '16px' }}>Contact</h4>
                {tokens.phone && <p style={{ color: '#94a3b8' }}>Phone: {tokens.phone}</p>}
                {tokens.email && <p style={{ color: '#94a3b8' }}>Email: {tokens.email}</p>}
              </div>
            </div>
            <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #334155', textAlign: 'center', color: '#94a3b8' }}>
              © {new Date().getFullYear()} {tokens.brandName}. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

