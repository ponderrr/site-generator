#!/usr/bin/env python3
"""
Simple content generator that creates proper business content
instead of analysis text.
"""

import os
import json
import yaml
from pathlib import Path

def load_config():
    """Load the site configuration."""
    config_path = Path("config/site.config.yaml")
    if not config_path.exists():
        print("❌ No config found, using defaults")
        return {
            "brand": {"name": "Your Business", "primary_cta": "Get a Free Quote"},
            "constants": {"phone": "", "email": ""}
        }
    
    with open(config_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def load_extracted_images():
    """Load images from the extracted content."""
    images = []
    
    # Look for images in the pack directory
    pack_dir = Path("build/pack/pages")
    if pack_dir.exists():
        for file_path in pack_dir.glob("*.md"):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Extract image URLs from markdown
                    import re
                    img_matches = re.findall(r'!\[([^\]]*)\]\(([^)]+)\)', content)
                    for alt, url in img_matches:
                        if url and url.startswith('http'):
                            images.append({
                                "url": url,
                                "alt": alt or "Image",
                                "title": alt or None
                            })
            except Exception as e:
                print(f"[WARNING] Could not read {file_path}: {e}")
    
    return images

def generate_homepage_content(config, images):
    """Generate homepage content."""
    brand_name = config["brand"]["name"]
    phone = config["constants"].get("phone", "")
    email = config["constants"].get("email", "")
    service_areas = config["constants"].get("service_areas", [])
    
    content = f"""# {brand_name}

Welcome to {brand_name}! We provide professional exterior cleaning services to make your property shine.

## Why Choose Us?

- **Eco-Friendly**: We use environmentally safe cleaning solutions
- **Professional Team**: Fully trained, licensed, and insured staff
- **Quality Equipment**: Commercial-grade equipment for superior results
- **Flexible Scheduling**: We work around your schedule

## Our Service Areas

We proudly serve {', '.join(service_areas) if service_areas else 'the local area'}."""

    # Add images if available
    if images:
        content += f"\n\n## Our Work in Action\n\n"
        for i, img in enumerate(images[:3]):  # Show first 3 images
            content += f"![{img['alt']}]({img['url']})\n\n"

    if phone:
        content += f"## Contact Us\n\nCall us at {phone} for a free quote!"
    elif email:
        content += f"## Contact Us\n\nEmail us at {email} for a free quote!"
    else:
        content += f"## Contact Us\n\n{config['brand']['primary_cta']} today!"
    
    content += f"\n\n{config['brand']['primary_cta']} today!"
    
    return content

def generate_services_content(config, images):
    """Generate services page content."""
    brand_name = config["brand"]["name"]
    cta = config["brand"]["primary_cta"]
    
    content = f"""# Our Services

{brand_name} offers comprehensive exterior cleaning services to keep your property looking its best.

## Driveway and Sidewalk Cleaning

We use professional surface cleaners to remove oil stains and other stubborn marks from your concrete surfaces. Our eco-friendly solutions are safe for your family and pets.

![Driveway Cleaning]({images[0]['url'] if images else 'https://source.unsplash.com/800x600/?driveway,pressure-washing'})

## House and Window Cleaning

We eliminate mold, mildew, and stains using environmentally safe chemicals, followed by our gentle soft washing technique that won't damage your property.

![House Cleaning]({images[1]['url'] if len(images) > 1 else 'https://source.unsplash.com/800x600/?house,cleaning,exterior'})

## Trash Can Cleaning

We thoroughly clean both the inside and outside of your trash cans and apply a special solution to eliminate odors, keeping your outdoor areas fresh and clean.

![Trash Can Cleaning]({images[2]['url'] if len(images) > 2 else 'https://source.unsplash.com/800x600/?trash-can,cleaning'})

## Why Choose Our Services?

- **Eco-Friendly Solutions**: Safe for your family and the environment
- **Professional Equipment**: Commercial-grade tools for superior results
- **Experienced Team**: Fully trained and insured professionals
- **Satisfaction Guaranteed**: We stand behind our work

Ready to transform your property? {cta} today!"""

    return content

def generate_contact_content(config, images):
    """Generate contact page content."""
    brand_name = config["brand"]["name"]
    phone = config["constants"].get("phone", "")
    email = config["constants"].get("email", "")
    service_areas = config["constants"].get("service_areas", [])
    cta = config["brand"]["primary_cta"]
    
    content = f"""# Contact {brand_name}

Ready to give your property the professional cleaning it deserves? We'd love to hear from you!

## Get Your Free Quote

{cta} today! We're standing by to provide you with a personalized quote for your exterior cleaning needs.

## Contact Information"""

    if phone:
        content += f"\n\n**Phone:** {phone}"
    if email:
        content += f"\n\n**Email:** {email}"
    
    if service_areas:
        content += f"\n\n## Service Areas\n\nWe proudly serve:"
        for area in service_areas:
            content += f"\n- {area}"
    
    content += f"\n\n## Why Choose {brand_name}?\n\n- Eco-friendly cleaning solutions\n- Fully licensed and insured\n- Professional, experienced team\n- Flexible scheduling\n- Satisfaction guaranteed\n\n{cta} today and let us make your property shine!"""
    
    return content

def generate_our_work_content(config, images):
    """Generate our work/portfolio page content."""
    brand_name = config["brand"]["name"]
    cta = config["brand"]["primary_cta"]
    
    content = f"""# Our Work

See the quality and attention to detail that sets {brand_name} apart from the competition.

## Before and After Gallery

Our professional cleaning services deliver dramatic results that speak for themselves. From stubborn oil stains to years of built-up grime, we restore your property to like-new condition.

"""

    # Add all available images
    if images:
        content += "### Recent Projects\n\n"
        for img in images:
            content += f"![{img['alt']}]({img['url']})\n\n"
    else:
        content += "![Before and After](https://source.unsplash.com/1200x800/?before-after,pressure-washing)\n\n"

    content += f"""## What Our Customers Say

> "Professional, reliable, and the results exceeded our expectations. Our driveway looks brand new!" - Satisfied Customer

> "The team was punctual, courteous, and did an amazing job. Highly recommended!" - Happy Homeowner

## Our Process

1. **Free Quote**: We provide detailed estimates with no obligation
2. **Eco-Friendly Preparation**: We use environmentally safe pre-treatment solutions
3. **Professional Cleaning**: Our commercial-grade equipment delivers superior results
4. **Final Inspection**: We ensure every detail meets our high standards

## Ready to See Results?

{cta} today and experience the {brand_name} difference!"""

    return content

def main():
    """Generate all content files."""
    config = load_config()
    images = load_extracted_images()
    
    print(f"[INFO] Loaded {len(images)} images from extracted content")
    
    # Create output directory
    output_dir = Path("build/generated")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate content for each page type
    pages = {
        "homepage": generate_homepage_content,
        "services": generate_services_content,
        "contact": generate_contact_content,
        "our-work": generate_our_work_content
    }
    
    for page_type, generator in pages.items():
        content = generator(config, images)
        
        # Save content
        filename = f"{page_type}.md"
        filepath = output_dir / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"[SUCCESS] Generated {filename}")
    
    print(f"\n[SUCCESS] Generated {len(pages)} content files with images")
    print("[INFO] Content is ready for website generation")

if __name__ == "__main__":
    main()
