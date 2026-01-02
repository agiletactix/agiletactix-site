# AgileTactix Marketing Site

Marketing website for AgileTactix - teaching agile professionals real-world AI and automation skills. Built with Astro and Tailwind CSS.

## 🚀 Project Overview

This site is designed to be a high-converting marketing website for AgileTactix, featuring:

- **Homepage** with compelling value proposition and clear CTAs
- **Blueprint page** - high-converting lead magnet download page
- **Blog** with tactical, valuable content using Astro Content Collections
- **About, Services, Contact** pages
- **Kit.com modal integration** for email capture
- **SEO optimization** with meta tags, schema.org markup, and sitemap
- **Fully responsive** design using Tailwind CSS

## 📋 Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

## 🛠️ Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/agiletactix/agiletactix-site.git
cd agiletactix-site
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The site will be available at `http://localhost:4321`

### 4. Build for Production

```bash
npm run build
```

### 5. Preview Production Build

```bash
npm run preview
```

## 📧 Adding Kit.com Form Embed

The Blueprint page includes a modal for email capture via Kit.com (formerly ConvertKit). To integrate your Kit.com form:

### Location

The modal component is located at: `/src/components/KitModal.astro`

### Instructions

1. **Create your Kit.com form:**
   - Go to [Kit.com](https://kit.com)
   - Create a new form for "Agile-AI Blueprint Download"
   - Form should collect: Email (required), First Name (optional)

2. **Get the embed code:**
   - In Kit.com, get your form's embed code
   - Should look like: `<script async data-uid="YOUR-FORM-ID" src="https://your-subdomain.ck.page/YOUR-FORM-ID/index.js"></script>`

3. **Add the embed code:**
   - Open `/src/components/KitModal.astro`
   - Find the comment block: `<!-- KIT.COM FORM EMBED SECTION -->`
   - Replace the placeholder content with your Kit.com embed code

4. **Configure Kit automation:**
   - Set up an automation in Kit.com to send the Blueprint PDF download link when someone subscribes
   - Success message: "Check your email! Your Blueprint is on its way."

### Form Styling

The custom CSS in `KitModal.astro` will automatically style your Kit.com form to match the site design. The styles target standard Kit.com form classes:

- `.formkit-form` - main form container
- `.formkit-field` - input field wrapper
- `input[type="email"]`, `input[type="text"]` - input fields
- `button[type="submit"]` - submit button
- `.formkit-alert` - success/error messages

No additional styling needed on your end!

## 🌐 Deployment

### GitHub Pages Deployment

This site uses GitHub Actions to automatically deploy to GitHub Pages on every push to the `main` branch.

#### Deployment Configuration

The deployment workflow is already set up in `.github/workflows/deploy.yml`. When you push to the `main` branch:

1. GitHub Actions builds the Astro site
2. Deploys to GitHub Pages (gh-pages branch)
3. Site is live at `https://agiletactix.github.io/agiletactix-site/`

#### Enabling GitHub Pages

1. Go to your repository settings on GitHub
2. Navigate to **Pages** section
3. Under "Source", select "Deploy from a branch"
4. Select branch: `gh-pages`
5. Click "Save"

### Custom Domain Setup

To use your custom domain `agiletactix.com`:

#### 1. Configure GitHub Pages

1. In your repository settings → Pages
2. Under "Custom domain", enter: `agiletactix.com`
3. Check "Enforce HTTPS" (after DNS is configured)
4. GitHub will create a CNAME file in the repository

#### 2. DNS Configuration

At your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.), add these DNS records:

**A Records (for apex domain agiletactix.com):**

```
Type: A
Name: @
Value: 185.199.108.153

Type: A
Name: @
Value: 185.199.109.153

Type: A
Name: @
Value: 185.199.110.153

Type: A
Name: @
Value: 185.199.111.153
```

**CNAME Record (for www subdomain):**

```
Type: CNAME
Name: www
Value: agiletactix.github.io
```

#### 3. Wait for DNS Propagation

- DNS changes can take 5-60 minutes to propagate
- Check propagation: `dig agiletactix.com`
- Once propagated, your site will be live at `https://agiletactix.com`

#### 4. HTTPS

GitHub Pages automatically provides SSL/TLS certificate via Let's Encrypt once DNS is configured. Check "Enforce HTTPS" in repository settings → Pages.

## 📁 Project Structure

```
/
├── public/
│   └── images/          # Static images and assets
├── src/
│   ├── components/
│   │   ├── Navigation.astro    # Header navigation
│   │   ├── Footer.astro        # Footer
│   │   └── KitModal.astro      # Kit.com email capture modal
│   ├── content/
│   │   ├── blog/               # Blog posts (Markdown/MDX)
│   │   └── config.ts           # Content collections config
│   ├── layouts/
│   │   └── BaseLayout.astro    # Base layout with nav/footer
│   ├── pages/
│   │   ├── index.astro         # Homepage
│   │   ├── blueprint.astro     # Lead magnet download page
│   │   ├── about.astro         # About page
│   │   ├── services.astro      # Services page
│   │   ├── contact.astro       # Contact page
│   │   └── blog/
│   │       ├── index.astro     # Blog index
│   │       └── [...slug].astro # Blog post template
│   └── styles/
│       └── global.css          # Global styles and Tailwind
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment
├── astro.config.mjs            # Astro configuration
├── tailwind.config.mjs         # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Project dependencies
```

## ✏️ Content Management

### Updating Homepage Copy

Edit `/src/pages/index.astro`

Key sections:
- Hero section (line ~8)
- Problem/Agitation (line ~40)
- Solution features (line ~70)
- Social proof (line ~120)
- Blueprint CTA (line ~200)

### Adding Blog Posts

1. Create a new `.md` or `.mdx` file in `/src/content/blog/`
2. Add frontmatter:

```yaml
---
title: "Your Post Title"
description: "Brief description for SEO and previews"
pubDate: 2026-01-15
author: "Danny"
tags: ["ai", "automation", "jira"]
---
```

3. Write your content in Markdown
4. Posts automatically appear on the blog index (sorted by date)

### Modifying Services Page

Edit `/src/pages/services.astro`

Update service offerings, pricing, or descriptions as needed.

### Updating About Page

Edit `/src/pages/about.astro`

Update personal story, credentials, or mission statement.

## 🎨 Design System

### Colors

The site uses a modern, tech-forward color palette defined in `tailwind.config.mjs`:

- **Primary** (Blues): Used for CTAs, links, accents
- **Secondary** (Purples): Used for secondary accents
- **Accent** (Yellows/Ambers): Used for highlights

### Typography

- **Font Family:** Inter (from Google Fonts)
- **Headings:** Bold, tight tracking
- **Body:** Regular weight, relaxed line height

### Components

Reusable component classes in `global.css`:

- `.btn-primary` - Primary CTA button
- `.btn-secondary` - Secondary button
- `.section-container` - Max-width container
- `.section-spacing` - Consistent vertical spacing
- `.heading-xl`, `.heading-lg`, etc. - Heading styles

## 🔍 SEO Features

### Meta Tags

All pages include:
- Title and description
- Open Graph tags (Facebook, LinkedIn)
- Twitter Card tags
- Canonical URLs

### Schema.org Markup

- Organization schema (global)
- Article schema (blog posts)
- Educational organization schema

### Sitemap

Automatically generated at build time via `@astrojs/sitemap`

Location: `/sitemap.xml`

## 🐛 Troubleshooting

### Build Errors

**Issue:** TypeScript errors during build

**Solution:**
```bash
npm run astro check
```

### Dev Server Not Starting

**Issue:** Port 4321 already in use

**Solution:**
```bash
# Kill process on port 4321
npx kill-port 4321

# Or specify different port
npm run dev -- --port 3000
```

### Kit.com Form Not Showing

**Issue:** Kit embed code not appearing

**Solution:**
1. Verify the script tag is properly inserted in `/src/components/KitModal.astro`
2. Check browser console for errors
3. Ensure script tag includes `async` attribute
4. Clear browser cache and hard reload

### Deployment Failing

**Issue:** GitHub Actions workflow failing

**Solution:**
1. Check Actions tab in GitHub for error logs
2. Verify `gh-pages` branch exists
3. Ensure GitHub Pages is enabled in repository settings
4. Check Node.js version in workflow matches your local version

### Custom Domain Not Working

**Issue:** Site not accessible at custom domain

**Solution:**
1. Verify DNS records are correct (use `dig agiletactix.com`)
2. Wait 30-60 minutes for DNS propagation
3. Check CNAME file exists in repository root
4. Verify "Custom domain" is set in GitHub Pages settings

## 📊 Analytics & Tracking

To add analytics tracking (Google Analytics, Plausible, etc.):

1. Add tracking script to `/src/layouts/BaseLayout.astro` in the `<head>` section
2. For GDPR compliance, consider adding a cookie consent banner

## 🔐 Environment Variables

If you need environment variables (API keys, etc.):

1. Create `.env` file (already in .gitignore)
2. Add variables:
```
PUBLIC_SITE_URL=https://agiletactix.com
```

3. Access in code:
```javascript
const siteUrl = import.meta.env.PUBLIC_SITE_URL;
```

## 📝 License

© 2026 LeanTech Creative, LLC (d/b/a Agile Tactix). All rights reserved.

## 🆘 Support

For questions or issues:

- Email: hello@agiletactix.com
- Create an issue in this repository

---

**Built with Astro + AI** 🚀
