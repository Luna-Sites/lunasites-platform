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
  logo: '/logo/logo_lunasites_6.png',
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
  { id: 'purple-blue', name: 'Purple & Blue', colors: ['#8B5CF6', '#3B82F6', '#0EA5E9'] },
  { id: 'emerald-teal', name: 'Emerald & Teal', colors: ['#10B981', '#14B8A6', '#06B6D4'] },
  { id: 'rose-pink', name: 'Rose & Pink', colors: ['#F43F5E', '#EC4899', '#A855F7'] },
  { id: 'orange-amber', name: 'Orange & Amber', colors: ['#F97316', '#F59E0B', '#EAB308'] },
  { id: 'slate-blue', name: 'Slate & Blue', colors: ['#475569', '#3B82F6', '#1E293B'] },
  { id: 'monochrome', name: 'Monochrome', colors: ['#1F2937', '#6B7280', '#F3F4F6'] },
  { id: 'forest-moss', name: 'Forest & Moss', colors: ['#059669', '#65A30D', '#15803D'] },
  { id: 'sunset', name: 'Sunset', colors: ['#DC2626', '#EA580C', '#FBBF24'] }
];

export const fontPairs = [
  {
    id: 'professional-1',
    category: 'Professional',
    name: 'Inter & Roboto',
    heading: 'Inter',
    body: 'Roboto',
    recommended: true
  },
  {
    id: 'professional-2',
    category: 'Professional',
    name: 'Lora & Open Sans',
    heading: 'Lora',
    body: 'Open Sans',
    recommended: false
  },
  {
    id: 'playful-1',
    category: 'Playful',
    name: 'Fredoka & Inter',
    heading: 'Fredoka',
    body: 'Inter',
    recommended: false
  },
  {
    id: 'playful-2',
    category: 'Playful',
    name: 'Quicksand & Work Sans',
    heading: 'Quicksand',
    body: 'Work Sans',
    recommended: false
  },
  {
    id: 'sophisticated-1',
    category: 'Sophisticated',
    name: 'Playfair Display & Lato',
    heading: 'Playfair Display',
    body: 'Lato',
    recommended: false
  },
  {
    id: 'sophisticated-2',
    category: 'Sophisticated',
    name: 'Cormorant & Source Sans',
    heading: 'Cormorant',
    body: 'Source Sans',
    recommended: false
  },
  {
    id: 'friendly-1',
    category: 'Friendly',
    name: 'Nunito & Open Sans',
    heading: 'Nunito',
    body: 'Open Sans',
    recommended: false
  },
  {
    id: 'friendly-2',
    category: 'Friendly',
    name: 'Poppins & Roboto',
    heading: 'Poppins',
    body: 'Roboto',
    recommended: false
  },
  {
    id: 'bold-1',
    category: 'Bold',
    name: 'Bebas Neue & Roboto',
    heading: 'Bebas Neue',
    body: 'Roboto',
    recommended: false
  },
  {
    id: 'bold-2',
    category: 'Bold',
    name: 'Oswald & Lato',
    heading: 'Oswald',
    body: 'Lato',
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
