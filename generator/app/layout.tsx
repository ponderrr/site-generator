import "./globals.css";
import tokens from "@themes/default/tokens";
import routeMap from "../data/route-map.json";

export const metadata = {
  title: tokens.brandName,
  description: tokens.tagline
};

// Generate navigation items from route-map
// Priority navigation items - shown in header and footer
const priorityUrls = ['/', '/services', '/our-work', '/about', '/contact'];
const navItems = routeMap.routes
  .filter((route: any) => priorityUrls.includes(route.url))
  .sort((a: any, b: any) => priorityUrls.indexOf(a.url) - priorityUrls.indexOf(b.url))
  .map((route: any) => ({
    url: route.url,
    label: route.url === '/' ? tokens.brandName : (route.title || route.url.split('/').pop() || 'Page')
  }));

// Fallback to basic nav if route-map has no routes
const defaultNav = navItems.length > 0 ? navItems : [
  { url: '/', label: tokens.brandName },
  { url: '/services', label: 'Services' },
  { url: '/contact', label: 'Contact' }
];

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
              {defaultNav.map((item) => (
                <a key={item.url} href={item.url} className="nav-link">
                  {item.label}
                </a>
              ))}
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
                  {defaultNav.map((item) => (
                    <a key={item.url} href={item.url} style={{ color: '#94a3b8' }}>
                      {item.label}
                    </a>
                  ))}
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

