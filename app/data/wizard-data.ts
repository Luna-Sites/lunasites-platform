import {
  Briefcase,
  Heart,
  Camera,
  Store,
  FileText,
  Calendar,
  Palette,
  Utensils,
} from 'lucide-react';

// Asset paths - mapping from Figma exports
export const ASSETS = {
  logo: '/logo/logo_lunasites_gradient.png',
  portfolioImg: '/wizard-assets/cadb01d5f39257b9bed043b110f35314dd1c3305.png',
  restaurantImg: '/wizard-assets/b23bd12188c3ef947fd6b1b0bbe43fd80fbfc342.png',
  shopImg: '/wizard-assets/71307606acb6787b5e76de625a8ec65231dd9256.png',
  blogImg: '/wizard-assets/041cf6f3cefd4852af7111701a69ab2fdd52620e.png',
  eventImg: '/wizard-assets/76d3c409747ba05034bcb396ba101e021e656b6e.png',
  img6: '/wizard-assets/f2b6ee8458f1f24edd1158a6df9bdc487e1e99a2.png',
  nebulaImg: '/wizard-assets/0c3285ca46a22c90514c77bd00a3b2fc67ea516b.png',
  nebulaStep3Img: '/images/nebula-1.png',
  nebulaStep4Img: '/images/nebula-2.png',
  nebulaSitesImg: '/images/nebula-3.png'
};

export const categories = [
  { id: 'popular', name: 'Popular Topics', icon: Heart },
  { id: 'portfolio', name: 'Portfolio', icon: Briefcase },
  { id: 'business', name: 'Business', icon: Briefcase },
  { id: 'photography', name: 'Photography', icon: Camera },
  { id: 'restaurant', name: 'Restaurant & Food', icon: Utensils },
  { id: 'ecommerce', name: 'E-commerce', icon: Store },
  { id: 'blog', name: 'Blog & Writing', icon: FileText },
  { id: 'events', name: 'Events', icon: Calendar },
  { id: 'creative', name: 'Creative & Arts', icon: Palette },
];

export const templates = [
  {
    id: 'portfolio-1',
    name: 'Modern Portfolio',
    category: 'portfolio',
    image: ASSETS.portfolioImg,
    description: 'Showcase your work beautifully'
  },
  {
    id: 'business-1',
    name: 'Business Pro',
    category: 'business',
    image: ASSETS.img6,
    description: 'Professional business presence'
  },
  {
    id: 'restaurant-1',
    name: 'Tasty Bites',
    category: 'restaurant',
    image: ASSETS.restaurantImg,
    description: 'Elegant restaurant website'
  },
  {
    id: 'shop-1',
    name: 'Shop Modern',
    category: 'ecommerce',
    image: ASSETS.shopImg,
    description: 'Beautiful online store'
  },
  {
    id: 'blog-1',
    name: 'Story Teller',
    category: 'blog',
    image: ASSETS.blogImg,
    description: 'Share your stories'
  },
  {
    id: 'events-1',
    name: 'Event Magic',
    category: 'events',
    image: ASSETS.eventImg,
    description: 'Stunning event pages'
  },
];

export const colorPalettes = [
  { id: 'purple-blue', name: 'Purple & Blue', colors: ['#8B5CF6', '#3B82F6', '#0EA5E9', '#FFFFFF'] },
  { id: 'emerald-teal', name: 'Emerald & Teal', colors: ['#10B981', '#14B8A6', '#06B6D4', '#FFFFFF'] },
  { id: 'rose-pink', name: 'Rose & Pink', colors: ['#F43F5E', '#EC4899', '#A855F7', '#FFF1F2'] },
  { id: 'orange-amber', name: 'Orange & Amber', colors: ['#F97316', '#F59E0B', '#EAB308', '#FFFBEB'] },
  { id: 'slate-blue', name: 'Slate & Blue', colors: ['#475569', '#3B82F6', '#1E293B', '#F8FAFC'] },
  { id: 'monochrome', name: 'Monochrome', colors: ['#1F2937', '#6B7280', '#F3F4F6', '#FFFFFF'] },
  { id: 'forest-moss', name: 'Forest & Moss', colors: ['#059669', '#65A30D', '#15803D', '#F0FDF4'] },
  { id: 'sunset', name: 'Sunset', colors: ['#DC2626', '#EA580C', '#FBBF24', '#FEF2F2'] }
];

/**
 * Font pairs for the wizard - synced with luna-theme font presets
 * Each pair includes:
 * - id: matches the CMS fontPresetId
 * - headingId/bodyId: font IDs for CMS typography settings
 * - heading/body: display names for preview (with font-family)
 */
export const fontPairs = [
  // Classic/Normal Sans-Serif (most common)
  {
    id: 'standard',
    category: 'Sans-Serif',
    name: 'Standard',
    heading: 'Roboto',
    body: 'Roboto',
    headingId: 'roboto',
    bodyId: 'roboto',
    headingWeight: 700,
    bodyWeight: 400,
    recommended: true
  },
  {
    id: 'professional',
    category: 'Sans-Serif',
    name: 'Professional',
    heading: 'Open Sans',
    body: 'Open Sans',
    headingId: 'open-sans',
    bodyId: 'open-sans',
    headingWeight: 700,
    bodyWeight: 400,
    recommended: false
  },
  {
    id: 'minimal',
    category: 'Sans-Serif',
    name: 'Minimal',
    heading: 'Lato',
    body: 'Lato',
    headingId: 'lato',
    bodyId: 'lato',
    headingWeight: 700,
    bodyWeight: 400,
    recommended: false
  },
  {
    id: 'business',
    category: 'Sans-Serif',
    name: 'Business',
    heading: 'Montserrat',
    body: 'Open Sans',
    headingId: 'montserrat',
    bodyId: 'open-sans',
    headingWeight: 600,
    bodyWeight: 400,
    recommended: false
  },
  {
    id: 'simple',
    category: 'Sans-Serif',
    name: 'Simple',
    heading: 'Source Sans 3',
    body: 'Source Sans 3',
    headingId: 'source-sans-pro',
    bodyId: 'source-sans-pro',
    headingWeight: 600,
    bodyWeight: 400,
    recommended: false
  },
  // Modern/Design Sans-Serif
  {
    id: 'modern',
    category: 'Sans-Serif',
    name: 'Modern',
    heading: 'Inter',
    body: 'Inter',
    headingId: 'inter',
    bodyId: 'inter',
    headingWeight: 700,
    bodyWeight: 400,
    recommended: false
  },
  {
    id: 'clean',
    category: 'Sans-Serif',
    name: 'Clean',
    heading: 'DM Sans',
    body: 'DM Sans',
    headingId: 'dm-sans',
    bodyId: 'dm-sans',
    headingWeight: 700,
    bodyWeight: 400,
    recommended: false
  },
  {
    id: 'geometric',
    category: 'Sans-Serif',
    name: 'Geometric',
    heading: 'Poppins',
    body: 'Poppins',
    headingId: 'poppins',
    bodyId: 'poppins',
    headingWeight: 600,
    bodyWeight: 400,
    recommended: false
  },
  {
    id: 'tech',
    category: 'Sans-Serif',
    name: 'Tech',
    heading: 'Space Grotesk',
    body: 'Work Sans',
    headingId: 'space-grotesk',
    bodyId: 'work-sans',
    headingWeight: 700,
    bodyWeight: 400,
    recommended: false
  },
  {
    id: 'friendly',
    category: 'Sans-Serif',
    name: 'Friendly',
    heading: 'Nunito Sans',
    body: 'Nunito Sans',
    headingId: 'nunito-sans',
    bodyId: 'nunito-sans',
    headingWeight: 700,
    bodyWeight: 400,
    recommended: false
  },
  // Serif Elegant
  {
    id: 'classic',
    category: 'Serif',
    name: 'Classic',
    heading: 'Playfair Display',
    body: 'Source Sans 3',
    headingId: 'playfair-display',
    bodyId: 'source-sans-pro',
    headingWeight: 700,
    bodyWeight: 400,
    recommended: false
  },
  {
    id: 'editorial',
    category: 'Serif',
    name: 'Editorial',
    heading: 'Cormorant Garamond',
    body: 'Lato',
    headingId: 'cormorant-garamond',
    bodyId: 'lato',
    headingWeight: 600,
    bodyWeight: 400,
    recommended: false
  },
  {
    id: 'elegant',
    category: 'Serif',
    name: 'Elegant',
    heading: 'Libre Baskerville',
    body: 'Open Sans',
    headingId: 'libre-baskerville',
    bodyId: 'open-sans',
    headingWeight: 700,
    bodyWeight: 400,
    recommended: false
  },
  {
    id: 'literary',
    category: 'Serif',
    name: 'Literary',
    heading: 'Merriweather',
    body: 'Lato',
    headingId: 'merriweather',
    bodyId: 'lato',
    headingWeight: 700,
    bodyWeight: 400,
    recommended: false
  },
  // Bold/Display
  {
    id: 'bold',
    category: 'Display',
    name: 'Bold',
    heading: 'Bebas Neue',
    body: 'Open Sans',
    headingId: 'bebas-neue',
    bodyId: 'open-sans',
    headingWeight: 400,
    bodyWeight: 400,
    recommended: false
  },
  {
    id: 'impact',
    category: 'Display',
    name: 'Impact',
    heading: 'Oswald',
    body: 'Roboto',
    headingId: 'oswald',
    bodyId: 'roboto',
    headingWeight: 700,
    bodyWeight: 400,
    recommended: false
  },
  {
    id: 'statement',
    category: 'Display',
    name: 'Statement',
    heading: 'Anton',
    body: 'Work Sans',
    headingId: 'anton',
    bodyId: 'work-sans',
    headingWeight: 400,
    bodyWeight: 400,
    recommended: false
  },
  // Mix/Creative
  {
    id: 'creative',
    category: 'Creative',
    name: 'Creative',
    heading: 'Bricolage Grotesque',
    body: 'Inter',
    headingId: 'bricolage-grotesque',
    bodyId: 'inter',
    headingWeight: 700,
    bodyWeight: 400,
    recommended: false
  },
  {
    id: 'artsy',
    category: 'Creative',
    name: 'Artsy',
    heading: 'Sora',
    body: 'Manrope',
    headingId: 'sora',
    bodyId: 'manrope',
    headingWeight: 600,
    bodyWeight: 400,
    recommended: false
  },
  {
    id: 'trendy',
    category: 'Creative',
    name: 'Trendy',
    heading: 'Outfit',
    body: 'Barlow',
    headingId: 'outfit',
    bodyId: 'barlow',
    headingWeight: 700,
    bodyWeight: 400,
    recommended: false
  }
];

export const buttonStyles = [
  { id: 'rounded', name: 'Rounded', borderRadius: '0.5rem' },
  { id: 'soft', name: 'Soft Rounded', borderRadius: '0.75rem' },
  { id: 'pill', name: 'Pill', borderRadius: '9999px' },
  { id: 'sharp', name: 'Sharp', borderRadius: '0px' },
  { id: 'minimal', name: 'Minimal Rounded', borderRadius: '0.25rem' }
];

export const inputStyles = [
  { id: 'rounded', name: 'Rounded', borderRadius: '0.5rem', border: '1px solid #cbd5e1' },
  { id: 'soft', name: 'Soft Rounded', borderRadius: '0.75rem', border: '1px solid #cbd5e1' },
  { id: 'sharp', name: 'Sharp', borderRadius: '0px', border: '1px solid #cbd5e1' },
  { id: 'minimal', name: 'Minimal Rounded', borderRadius: '0.25rem', border: '1px solid #cbd5e1' },
  { id: 'underline', name: 'Underline', borderRadius: '0px', border: 'none', borderBottom: '2px solid #cbd5e1' }
];
