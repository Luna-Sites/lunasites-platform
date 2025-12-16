import { 
  Sparkles, 
  Layout, 
  Zap, 
  Database, 
  BarChart3, 
  Star,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Cloud,
  FileText,
  Grid3x3,
  Play
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useEffect, useState } from 'react';
import img1 from 'figma:asset/10391a7ca29ad263731d7687d570622ac7e9dc19.png';
import img2 from 'figma:asset/f432d8cfb83f62a693968f2bf6731195f9176fa9.png';
import img3 from 'figma:asset/4f49d63d01493255367e4d75ee99b09f18aa146c.png';
import img4 from 'figma:asset/06c490aaa5f1399b6063611696f959cca89d4f6d.png';
import img5 from 'figma:asset/76d3c409747ba05034bcb396ba101e021e656b6e.png';
import img6 from 'figma:asset/f2b6ee8458f1f24edd1158a6df9bdc487e1e99a2.png';
import img7 from 'figma:asset/cd671a77a5870c5a2174209bed2580545aea69f8.png';
import img8 from 'figma:asset/dd11a115415f00318fe011fbbc8b7788d9b10b93.png';
import img9 from 'figma:asset/571df31db889bf75505bb2d5ceb3314da4ed3b29.png';
import img10 from 'figma:asset/fdf2b5503dcf8a5040c8c7d81a3e4756c9d51115.png';
import img11 from 'figma:asset/884fee805a74cd0c4c3945ec5ef6014b4f364419.png';
import img12 from 'figma:asset/90f967f4603a622041a09cdf7c60c9c9764d09bb.png';
import logo from 'figma:asset/1e2df6b5a066341b6419d0cf910c5e86038504d4.png';
import demoVideo from 'figma:asset/f74c5df1d43c6beda070c17ea4d3ca33e01bbea1.png';
import portfolioImg from 'figma:asset/cadb01d5f39257b9bed043b110f35314dd1c3305.png';
import restaurantImg from 'figma:asset/b23bd12188c3ef947fd6b1b0bbe43fd80fbfc342.png';
import shopImg from 'figma:asset/71307606acb6787b5e76de625a8ec65231dd9256.png';
import blogImg from 'figma:asset/041cf6f3cefd4852af7111701a69ab2fdd52620e.png';
import eventImg from 'figma:asset/76d3c409747ba05034bcb396ba101e021e656b6e.png';
import footerLogo from 'figma:asset/6fbf88b0b69d3848c24da7ce84e70ec43456e4c6.png';

interface HomepageProps {
  onStartNow: () => void;
  onLogin: () => void;
}

export default function Homepage({ onStartNow, onLogin }: HomepageProps) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const showcaseWebsites = [
    {
      id: 10,
      title: 'Travel Explorer',
      subtitle: 'Adventure Platform',
      image: img10
    },
    {
      id: 11,
      title: 'Minimalist Landing',
      subtitle: 'Modern Design',
      image: img11
    },
    {
      id: 12,
      title: 'Adventure Travel',
      subtitle: 'Outdoor Experiences',
      image: img12
    }
  ];

  const templates = [
    {
      id: 1,
      name: 'Modern Portfolio',
      category: 'Portfolio',
      image: portfolioImg
    },
    {
      id: 2,
      name: 'Business Pro',
      category: 'Business',
      image: img6
    },
    {
      id: 3,
      name: 'Tasty Bites',
      category: 'Restaurant',
      image: restaurantImg
    },
    {
      id: 4,
      name: 'Shop Modern',
      category: 'E-commerce',
      image: shopImg
    },
    {
      id: 5,
      name: 'Blog Minimal',
      category: 'Blog',
      image: blogImg
    },
    {
      id: 6,
      name: 'Event Flow',
      category: 'Event',
      image: eventImg
    }
  ];

  const features = [
    {
      icon: Layout,
      title: 'Drag & Drop Builder',
      description: 'Intuitive visual editor that makes building websites effortless. No coding required.'
    },
    {
      icon: Grid3x3,
      title: 'Grid-Based Design',
      description: 'Position blocks freely on a flexible grid system. Create unique layouts with precision and ease.'
    },
    {
      icon: Sparkles,
      title: 'AI Page Generator',
      description: 'Let AI create stunning pages for you in seconds. Just describe what you need.'
    },
    {
      icon: Zap,
      title: 'Premium Templates',
      description: 'Choose from hundreds of professionally designed templates for every industry.'
    },
    {
      icon: Database,
      title: 'Secure Hosting',
      description: 'Fast, reliable hosting with SSL certificates and automatic backups included.'
    },
    {
      icon: BarChart3,
      title: 'Built-in Analytics',
      description: 'Track your site performance with powerful analytics and insights dashboard.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Designer & Founder',
      content: 'This is hands down the best website builder I\'ve used. The AI features are incredible and saved me hours of work.',
      rating: 5
    },
    {
      name: 'Marcus Johnson',
      role: 'Small Business Owner',
      content: 'I launched my business website in just one afternoon. The templates are gorgeous and so easy to customize.',
      rating: 5
    },
    {
      name: 'Emma Rodriguez',
      role: 'Freelance Developer',
      content: 'Even as a developer, I use this for client projects. It\'s fast, modern, and the code quality is excellent.',
      rating: 5
    }
  ];

  // Auto-slide carousel with infinite loop
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Handle infinite loop reset
  useEffect(() => {
    if (currentSlide === showcaseWebsites.length) {
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentSlide(0);
        setTimeout(() => {
          setIsTransitioning(true);
        }, 50);
      }, 700);
    } else if (currentSlide === -1) {
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentSlide(showcaseWebsites.length - 1);
        setTimeout(() => {
          setIsTransitioning(true);
        }, 50);
      }, 700);
    }
  }, [currentSlide, showcaseWebsites.length]);

  const goToSlide = (index: number) => {
    setIsTransitioning(true);
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setIsTransitioning(true);
    setCurrentSlide((prev) => prev + 1);
  };

  const prevSlide = () => {
    setIsTransitioning(true);
    setCurrentSlide((prev) => prev - 1);
  };

  return (
    <div className="min-h-screen bg-amber-50/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/50">
        <div className="w-full px-6 py-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-6">
            <img src={logo} alt="Lunasites" className="h-12" style={{ marginTop: '-6px' }} />
            
            <nav className="hidden md:flex items-end gap-8">
              <a href="#templates" className="text-slate-600 hover:text-slate-900 transition-colors">Templates</a>
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onLogin}>Login</Button>
            <Button 
              onClick={onStartNow}
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
            >
              Start Now
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16 -mt-8">
            <h1 className="text-slate-900 mb-6 text-7xl font-bold">
              Your Website. Your Content. One Platform.
            </h1>
            
            <p className="text-slate-600 text-xl max-w-2xl mx-auto mb-10">
              Create stunning websites in minutes with our AI-assisted builder. 
              No coding required. Professional templates, drag-and-drop simplicity, 
              and powerful features all in one platform.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Button 
                size="lg"
                onClick={onStartNow}
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 px-8"
              >
                Start Building Now
              </Button>
              <Button size="lg" variant="outline">
                View Demo
              </Button>
            </div>


          </div>

        </div>
      </section>

      {/* Hero Carousel - Full Width with Peek */}
      <section className="relative -mt-32 mb-6">
        <div className="relative overflow-hidden">
          {/* Slides Container */}
          <div className="relative py-12">
            <div 
              className="flex gap-6"
              style={{ 
                transform: `translateX(calc(50vw - 36% - ${currentSlide} * (72% + 1.5rem)))`,
                transition: isTransitioning ? 'transform 700ms ease-in-out' : 'none',
                paddingLeft: '0',
                paddingRight: '0'
              }}
            >
              {/* Clone last slide at the beginning */}
              <div className="flex-none w-[72%]">
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden group cursor-pointer mx-auto">
                  <ImageWithFallback
                    src={showcaseWebsites[showcaseWebsites.length - 1].image}
                    alt={showcaseWebsites[showcaseWebsites.length - 1].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>

              {/* Original slides */}
              {showcaseWebsites.map((website) => (
                <div
                  key={website.id}
                  className="flex-none w-[72%]"
                >
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden group cursor-pointer mx-auto">
                    <ImageWithFallback
                      src={website.image}
                      alt={website.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
              ))}

              {/* Clone first slide at the end */}
              <div className="flex-none w-[72%]">
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden group cursor-pointer mx-auto">
                  <ImageWithFallback
                    src={showcaseWebsites[0].image}
                    alt={showcaseWebsites[0].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-center">
            {/* Dot Indicators */}
            <div className="flex gap-2">
              {showcaseWebsites.map((_, index) => {
                const actualIndex = currentSlide < 0 ? showcaseWebsites.length - 1 : currentSlide >= showcaseWebsites.length ? 0 : currentSlide;
                return (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`transition-all ${
                      index === actualIndex
                        ? 'w-8 h-2 bg-white rounded-full'
                        : 'w-2 h-2 bg-white/50 rounded-full hover:bg-white/75'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="pt-12 pb-20 px-6 bg-stone-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className="p-8 border-slate-200 hover:border-purple-300 transition-all duration-300 shadow-sm hover:shadow-lg"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Browser Window Frame */}
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Browser Chrome */}
            <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b border-slate-200">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded px-3 py-1 text-xs text-slate-500 max-w-md">
                  editor.lunaweb.com
                </div>
              </div>
            </div>
            
            {/* Video Container */}
            <div className="relative aspect-video bg-slate-50 group cursor-pointer">
              <img 
                src={demoVideo} 
                alt="Website Editor Demo" 
                className="w-full h-full object-cover"
              />
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <div className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                  <Play className="w-8 h-8 text-purple-600 ml-1" fill="currentColor" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section id="templates" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[rgb(33,33,33)] mb-4 text-5xl font-bold">
              Beautiful Templates for Every Need
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Start with a professionally designed template and make it your own
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((template) => (
              <Card 
                key={template.id}
                className="group overflow-hidden border-slate-200 hover:border-purple-300 transition-all duration-300 hover:shadow-xl cursor-pointer"
              >
                <div className="relative overflow-hidden aspect-[4/3]">
                  <ImageWithFallback
                    src={template.image}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/0" />
                  
                  {/* Text Overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white mb-1">{template.name}</h3>
                    <p className="text-sm text-white/80">{template.category}</p>
                  </div>
                  
                  {/* Hover Button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button className="bg-white text-slate-900 hover:bg-slate-100">
                      Use Template
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" className="text-purple-600 hover:text-purple-700">
              View All Templates
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-slate-900 mb-4">
              Loved by Creators Worldwide
            </h2>
            <p className="text-slate-600 text-lg">
              Join thousands of happy customers building their dreams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 border-slate-200">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6">"{testimonial.content}"</p>
                <div>
                  <div className="text-slate-900">{testimonial.name}</div>
                  <div className="text-sm text-slate-500">{testimonial.role}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center bg-gradient-to-br from-purple-600 to-fuchsia-600 border-0">
            <h2 className="text-white mb-4">
              Ready to Build Your Dream Website?
            </h2>
            <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of creators and businesses who trust LunaWeb to power their online presence
            </p>
            <Button 
              size="lg"
              onClick={onStartNow}
              className="bg-white text-purple-600 hover:bg-slate-100 px-8"
            >
              Get Started Now
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="mb-4">
                <img src={footerLogo} alt="Lunasites" className="h-6" />
              </div>
              <p className="text-slate-400">
                Build beautiful websites effortlessly with AI-powered tools
              </p>
            </div>

            <div>
              <h4 className="text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Examples</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400">© 2025 Lunasites. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}