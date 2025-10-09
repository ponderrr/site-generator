# 🚀 Quick Start: Modern Design System

Your generator now has a complete 2025-ready design system with Tailwind CSS! Here's what you need to know:

## ✅ What's Installed

- ✅ **Tailwind CSS v4** - Modern utility-first CSS framework
- ✅ **Inter Font** - Professional, modern typography
- ✅ **Site Configuration** - Centralized brand constants
- ✅ **Modern UI Components** - Ready-to-use React components
- ✅ **Enhanced Tokens** - Extended design system tokens
- ✅ **Responsive Utilities** - Mobile-first responsive design
- ✅ **Accessibility Features** - WCAG compliant components

## 🎨 Using the Design System

### 1. Import Site Config

Replace hardcoded values with the site config:

```tsx
import { siteConfig } from '@/config/site.config';

// Use anywhere in your templates
<h1>{siteConfig.name}</h1>
<a href={`tel:${siteConfig.phone}`}>{siteConfig.phone}</a>
```

### 2. Use New Components

Import and use the modern components:

```tsx
// Before/After Slider
import { BeforeAfterSlider } from '@themes/default/components/BeforeAfterSlider';

<BeforeAfterSlider
  beforeSrc="/images/before.jpg"
  afterSrc="/images/after.jpg"
/>

// WhyChooseUs Section
import { WhyChooseUs } from '@themes/default/components/WhyChooseUs';

<WhyChooseUs
  features={[
    { icon: "✅", title: "Licensed", description: "Fully insured" },
    { icon: "🌿", title: "Eco-Friendly", description: "Safe chemicals" },
  ]}
/>

// Mobile Menu
import { MobileMenu } from '@themes/default/components/MobileMenu';

<MobileMenu
  items={[
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" }
  ]}
  ctaLabel="Get a Quote"
  ctaHref="/contact"
/>
```

### 3. Use Tailwind Classes

Apply modern utility classes directly:

```tsx
<div className="container mx-auto px-4">
  <h1 className="text-4xl font-bold text-zinc-900 mb-6">
    Welcome
  </h1>
  <p className="text-lg text-zinc-600 leading-relaxed">
    Your content here
  </p>
</div>
```

### 4. Use Custom CSS Utilities

```tsx
// Noise background overlay
<div className="absolute inset-0 noise-bg opacity-10" />

// Gradient text
<span className="gradient-text">Gradient Heading</span>

// Backdrop blur header
<header className="backdrop-blur-soft bg-white/70" />

// Focus ring (accessibility)
<button className="focus-ring">Click me</button>
```

## 📁 File Structure

```
generator/
├── config/
│   └── site.config.ts          ← Brand constants
├── themes/default/
│   ├── tokens.ts               ← Enhanced design tokens
│   └── components/
│       ├── BeforeAfterSlider.tsx
│       ├── MobileMenu.tsx
│       ├── WhyChooseUs.tsx
│       └── TrustBadge.tsx
├── app/
│   └── globals.css             ← Enhanced with Tailwind
├── public/images/              ← Add your images here
├── tailwind.config.js          ← Tailwind configuration
└── postcss.config.cjs          ← PostCSS configuration
```

## 🖼️ Adding Images

1. Place images in `public/images/`
2. Reference them in your components:

```tsx
<img src="/images/your-image.jpg" alt="Description" />
```

3. Or update the config:

```typescript
// In config/site.config.ts
hero: {
  image: "/images/your-hero.jpg"
}
```

## 🎯 Next Steps

### 1. Customize Colors

Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#YOUR_COLOR',
      }
    }
  }
}
```

### 2. Add Real Images

Replace placeholder images in `public/images/`:
- `pressure-wash-hero.jpg` (1200x600px)
- `before.jpg` & `after.jpg` (800x600px)

### 3. Update Site Config

Edit `config/site.config.ts` with your actual info:

```typescript
export const siteConfig = {
  name: "Your Business Name",
  phone: "Your Phone",
  email: "your@email.com",
  // ... more settings
};
```

### 4. Enhance Templates

Your existing templates can now use all these new features!

Example for `homepage.tsx`:

```tsx
import { WhyChooseUs } from "../components/WhyChooseUs";
import { siteConfig } from "@/config/site.config";

export default function HomepageTemplate({ meta, children }) {
  return (
    <>
      {/* Modern hero with Tailwind */}
      <section className="relative pt-28 pb-16 bg-gradient-to-br from-primary to-primary-dark">
        <div className="container mx-auto">
          <h1 className="text-5xl font-bold text-white mb-4">
            {siteConfig.name}
          </h1>
          {/* Your content */}
        </div>
      </section>

      {/* Use new components */}
      <WhyChooseUs features={yourFeatures} />

      {/* MDX content */}
      <section className="section">
        <div className="prose container mx-auto">
          {children}
        </div>
      </section>
    </>
  );
}
```

## 🔨 Build & Deploy

```bash
# Development mode
pnpm dev

# Build for production
pnpm build

# The static files will be in the 'out' directory
# Deploy the 'out' folder to any static host
```

## 📚 Documentation

- Full documentation: `DESIGN-SYSTEM.md`
- Image guidelines: `public/images/README.md`
- Tailwind docs: https://tailwindcss.com/docs

## 💡 Tips

1. **Keep automation intact**: Only modify templates and components, not generated content
2. **Use the config**: Always pull from `site.config.ts` instead of hardcoding
3. **Stay consistent**: Use Tailwind classes for new styling
4. **Test responsive**: Check mobile, tablet, and desktop views
5. **Check accessibility**: Run Lighthouse audits regularly

## 🎨 Example: Modern Split Hero

```tsx
<section className="relative pt-28 pb-16">
  {/* Gradient background */}
  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-500 to-sky-600" />
  
  {/* Noise overlay */}
  <div className="absolute inset-0 -z-10 opacity-10 noise-bg" />
  
  <div className="container mx-auto px-4">
    <div className="grid lg:grid-cols-2 gap-10 items-center">
      {/* Left: Content */}
      <div className="text-white">
        <h1 className="text-5xl font-extrabold mb-6">
          {siteConfig.name}
        </h1>
        <p className="text-xl mb-8 text-white/90">
          Professional exterior cleaning services
        </p>
        <div className="flex gap-4">
          <a href="/contact" className="btn-primary">
            Get a Free Quote
          </a>
          <a href={`tel:${siteConfig.phone}`} 
             className="px-6 py-3 rounded-full border-2 border-white text-white hover:bg-white hover:text-sky-600 transition">
            Call Now
          </a>
        </div>
      </div>
      
      {/* Right: Image */}
      <div className="relative">
        <img 
          src={siteConfig.hero.image}
          alt="Hero image"
          className="rounded-3xl shadow-2xl"
        />
      </div>
    </div>
  </div>
</section>
```

---

🎉 **You're all set!** Your automated system now has a modern, professional design foundation that your templates can leverage while the AI continues to generate content automatically.

Questions? Check `DESIGN-SYSTEM.md` for detailed documentation.




