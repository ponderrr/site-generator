# Images Directory

This directory contains images for the website.

## Required Images

### Hero Image
- **File**: `hero.jpg` (or any name referenced in your config)
- **Size**: 1200x600px (recommended)
- **Description**: Main hero image for the homepage
- **Alt text**: Should describe your business/service

### Before/After Images (if applicable)
- **File**: `before.jpg` and `after.jpg`
- **Size**: 800x600px (recommended)
- **Description**: Before and after comparison images for the slider

## Placeholder Images

If you don't have actual images yet, you can use placeholder services:

### Using placehold.co
- Hero: `https://placehold.co/1200x600/0ea5e9/white?text=Your+Business+Name`
- Before: `https://placehold.co/800x600/94a3b8/white?text=Before`
- After: `https://placehold.co/800x600/10b981/white?text=After`

### Using Unsplash
Search for images related to your business type and industry

## Image Optimization Tips

1. **Format**: Use WebP for better compression (Next.js will handle this)
2. **Size**: Keep images under 500KB when possible
3. **Dimensions**: Match the recommended sizes above
4. **Quality**: 80-90% is usually sufficient
5. **Alt text**: Always include descriptive alt text for accessibility

## Adding Images

Simply place your images in this directory and reference them as:
```jsx
<img src="/images/your-image.jpg" alt="Description" />
```

Or in the site config:
```typescript
hero: {
  image: "/images/pressure-wash-hero.jpg"
}
```




