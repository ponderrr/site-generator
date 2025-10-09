# Modern 2025 Design System

This document describes the modern design system added to the Northshore Exterior Upkeep generator.

## 🎨 What's New

### 1. Tailwind CSS Integration
- Fully configured Tailwind CSS v4
- Custom color palette matching brand
- Responsive utilities
- Modern font loading (Inter)

### 2. Brand Configuration System
Located in `config/site.config.ts`:
```typescript
export const siteConfig = {
  name: "Northshore Exterior Upkeep",
  phone: "(985) 662-8005",
  email: "northshoreexteriorupkeep@gmail.com",
  serviceArea: "Serving Baton Rouge → Slidell",
  // ... more config
}
```

**How to use**: Import and use these constants in your templates instead of hardcoding.

### 3. Modern UI Components

#### BeforeAfterSlider
Interactive image comparison slider.
```tsx
import { BeforeAfterSlider } from '@themes/default/components/BeforeAfterSlider';

<BeforeAfterSlider
  beforeSrc="/images/before.jpg"
  afterSrc="/images/after.jpg"
  beforeAlt="Before cleaning"
  afterAlt="After cleaning"
/>
```

#### MobileMenu
Slide-in mobile navigation with overlay.
```tsx
import { MobileMenu } from '@themes/default/components/MobileMenu';

<MobileMenu
  items={[
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" }
  ]}
  ctaLabel="Get a Free Quote"
  ctaHref="/contact"
/>
```

#### WhyChooseUs
Feature grid section.
```tsx
import { WhyChooseUs } from '@themes/default/components/WhyChooseUs';

<WhyChooseUs
  title="Why Choose Us?"
  features={[
    {
      icon: "✅",
      title: "Licensed & Insured",
      description: "Fully certified and insured for your peace of mind"
    }
  ]}
/>
```

#### TrustBadge
Inline trust indicators.
```tsx
import { TrustBadge } from '@themes/default/components/TrustBadge';

<TrustBadge
  items={[
    "⭐⭐⭐⭐⭐ 4.9 on Google",
    "Licensed & Insured",
    "Eco-friendly"
  ]}
/>
```

### 4. Enhanced CSS Utilities

#### Noise Background
```html
<div class="noise-bg opacity-10"></div>
```

#### Focus Ring
```html
<button class="focus-ring">Accessible Button</button>
```

#### Backdrop Blur
```html
<header class="backdrop-blur-soft bg-white/70"></header>
```

#### Gradient Text
```html
<span class="gradient-text">Gradient Heading</span>
```

### 5. Updated Design Tokens

Located in `themes/default/tokens.ts`:
- **Colors**: Extended palette with light/dark variants
- **Typography**: Added font size scale
- **Spacing**: Extended spacing scale (xs → 5xl)
- **Shadows**: More shadow options
- **Transitions**: Timing presets
- **Contact Info**: Phone, email, service area

## 🎯 Using the Design System in Templates

### Example: Modern Homepage Template

```tsx
import { WhyChooseUs } from "../components/WhyChooseUs";
import { BeforeAfterSlider } from "../components/BeforeAfterSlider";
import { siteConfig } from "@/config/site.config";

export default function HomepageTemplate({ meta, children }) {
  return (
    <>
      {/* Split Hero with Tailwind */}
      <section className="relative pt-28 pb-16 sm:pt-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary to-primary-dark" />
        <div className="absolute inset-0 -z-10 opacity-10 noise-bg" />
        
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left: Copy */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm backdrop-blur mb-5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                {siteConfig.serviceArea}
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                {siteConfig.name}
              </h1>
              
              <p className="mt-4 text-lg text-white/85">
                Eco-friendly pressure washing and exterior maintenance
              </p>
              
              {/* CTAs */}
              <div className="mt-8 flex gap-3">
                <a href="/contact" className="btn-primary">
                  {siteConfig.ctas.primary}
                </a>
                <a href={`tel:${siteConfig.phone}`} className="btn-secondary">
                  {siteConfig.ctas.secondary}
                </a>
              </div>
            </div>
            
            {/* Right: Image */}
            <div className="relative">
              <img 
                src={siteConfig.hero.image} 
                alt="Professional pressure washing"
                className="rounded-3xl shadow-2xl"
                loading="eager"
              />
              
              {/* Floating badge */}
              <div className="absolute -bottom-5 left-6 rounded-2xl bg-white px-4 py-3 shadow-lg">
                <div className="text-sm font-semibold">{siteConfig.hero.badge.text}</div>
                <div className="text-xs text-zinc-500">{siteConfig.hero.badge.subtext}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Why Choose Us */}
      <WhyChooseUs
        features={[
          {
            icon: "💧",
            title: "Eco-Friendly",
            description: "Safe chemicals for your family and pets"
          },
          {
            icon: "🛡️",
            title: "Licensed & Insured",
            description: "Fully certified professionals"
          },
          {
            icon: "⚡",
            title: "Fast Service",
            description: "48-hour average turnaround"
          }
        ]}
      />
      
      {/* MDX Content */}
      <section className="section">
        <div className="container prose mx-auto">
          {children}
        </div>
      </section>
      
      {/* Before/After */}
      <section className="section section-alt">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            See the Difference
          </h2>
          <div className="max-w-3xl mx-auto">
            <BeforeAfterSlider
              beforeSrc="/images/before.jpg"
              afterSrc="/images/after.jpg"
            />
          </div>
        </div>
      </section>
    </>
  );
}
```

## 📱 Responsive Design

All components are mobile-first and responsive:
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Grid system: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Mobile menu: Hidden on desktop, slide-in on mobile
- Typography: Fluid sizing with `clamp()`

## ♿ Accessibility Features

- Focus visible states on all interactive elements
- ARIA labels and roles
- Keyboard navigation support
- Reduced motion support via `prefers-reduced-motion`
- Color contrast ≥ 4.5:1
- Semantic HTML landmarks

## 🚀 Performance Optimizations

- Lazy loading images (`loading="lazy"`)
- Priority loading for hero images (`loading="eager"`)
- Font display swap for web fonts
- Backdrop filter with fallbacks
- CSS containment where appropriate

## 🎨 Color Palette

### Primary (Blue)
- `primary`: #0ea5e9
- `primary-dark`: #0284c7
- `primary-light`: #38bdf8

### Secondary (Green)
- `secondary`: #10b981
- `secondary-dark`: #059669

### Neutrals
- `text`: #0f172a
- `text-light`: #64748b
- `text-muted`: #94a3b8
- `bg-light`: #f8fafc
- `border`: #e2e8f0

## 📝 Quick Customization

### Change Brand Colors
Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#YOUR_COLOR',
        dark: '#YOUR_DARK_COLOR',
      }
    }
  }
}
```

### Change Fonts
Edit `app/globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=YOUR_FONT&display=swap');
```

Update `tailwind.config.js`:
```javascript
fontFamily: {
  sans: ['Your Font', 'sans-serif'],
}
```

### Add New Components
Create in `themes/default/components/YourComponent.tsx`:
```tsx
export function YourComponent() {
  return <div className="your-styles">Content</div>;
}
```

## 🔧 Maintenance

### Rebuilding Styles
```bash
cd generator
pnpm build
```

### Linting
```bash
pnpm prettify
```

### Testing Changes
```bash
pnpm dev
```

## 📚 Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Web Accessibility](https://www.w3.org/WAI/fundamentals/accessibility-intro/)
- [Core Web Vitals](https://web.dev/vitals/)

## 🎯 Next Steps

1. **Add Real Images**: Replace placeholders in `public/images/`
2. **Customize Colors**: Update Tailwind config with brand colors
3. **Add More Components**: Create components for testimonials, FAQs, etc.
4. **Optimize Images**: Compress and convert to WebP
5. **Test Accessibility**: Run Lighthouse audits
6. **Add Analytics**: Integrate tracking (GA4, etc.)

---

**Remember**: This design system is separate from your automated content generation. It provides the foundation and components that your templates can use, while the AI continues to generate content automatically.




