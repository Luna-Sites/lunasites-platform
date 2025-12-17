import type { Route } from "./+types/home";
import { useEffect, useState } from "react";
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
  Grid3x3,
  Play,
  Settings,
  LogOut,
  HelpCircle,
} from "lucide-react";
const Logo = "/logo/logo_lunasites_6.png";
import { showcaseImages, templateImages, demoImage } from "../lib/assets";
import { useAuth } from "../contexts/AuthContext";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Luna Sites - Build Your Dream Website" },
    {
      name: "description",
      content:
        "Create professional websites with Luna Sites - the simplest website builder inspired by WordPress.com. Modern themes, fast performance, responsive design.",
    },
  ];
}

export default function Home() {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Get user initials for avatar
  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "U";

  const showcaseWebsites = [
    {
      id: 10,
      title: "Travel Explorer",
      subtitle: "Adventure Platform",
      image: showcaseImages.img10,
    },
    {
      id: 11,
      title: "Minimalist Landing",
      subtitle: "Modern Design",
      image: showcaseImages.img11,
    },
    {
      id: 12,
      title: "Adventure Travel",
      subtitle: "Outdoor Experiences",
      image: showcaseImages.img12,
    },
  ];

  const templates = [
    {
      id: 1,
      name: "Modern Portfolio",
      category: "Portfolio",
      image: templateImages.portfolio,
    },
    {
      id: 2,
      name: "Business Pro",
      category: "Business",
      image: templateImages.business,
    },
    {
      id: 3,
      name: "Tasty Bites",
      category: "Restaurant",
      image: templateImages.restaurant,
    },
    {
      id: 4,
      name: "Shop Modern",
      category: "E-commerce",
      image: templateImages.shop,
    },
    {
      id: 5,
      name: "Blog Minimal",
      category: "Blog",
      image: templateImages.blog,
    },
    {
      id: 6,
      name: "Event Flow",
      category: "Event",
      image: templateImages.event,
    },
  ];

  const features = [
    {
      icon: Layout,
      title: "Drag & Drop Builder",
      description:
        "Intuitive visual editor that makes building websites effortless. No coding required.",
    },
    {
      icon: Grid3x3,
      title: "Grid-Based Design",
      description:
        "Position blocks freely on a flexible grid system. Create unique layouts with precision and ease.",
    },
    {
      icon: Sparkles,
      title: "AI Page Generator",
      description:
        "Let AI create stunning pages for you in seconds. Just describe what you need.",
    },
    {
      icon: Zap,
      title: "Premium Templates",
      description:
        "Choose from hundreds of professionally designed templates for every industry.",
    },
    {
      icon: Database,
      title: "Secure Hosting",
      description:
        "Fast, reliable hosting with SSL certificates and automatic backups included.",
    },
    {
      icon: BarChart3,
      title: "Built-in Analytics",
      description:
        "Track your site performance with powerful analytics and insights dashboard.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Designer & Founder",
      content:
        "This is hands down the best website builder I've used. The AI features are incredible and saved me hours of work.",
      rating: 5,
    },
    {
      name: "Marcus Johnson",
      role: "Small Business Owner",
      content:
        "I launched my business website in just one afternoon. The templates are gorgeous and so easy to customize.",
      rating: 5,
    },
    {
      name: "Emma Rodriguez",
      role: "Freelance Developer",
      content:
        "Even as a developer, I use this for client projects. It's fast, modern, and the code quality is excellent.",
      rating: 5,
    },
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

  return (
    <div className="min-h-screen bg-amber-50/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/50">
        <div className="w-full px-6 py-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-[74px]">
            <a href="/" className="flex items-center gap-2">
              <img src={Logo} alt="Luna Sites" className="w-[130px]" />
            </a>

            <nav className="hidden md:flex items-end gap-8">
              <a
                href="#templates"
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                Templates
              </a>
              <a
                href="#features"
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                Pricing
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5A318F] to-[#D920B7] flex items-center justify-center text-white text-sm cursor-pointer font-semibold">
                  {userInitials}
                </div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <a
                    href="/sites"
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-t-lg"
                  >
                    <Layout className="w-4 h-4" />
                    My Sites
                  </a>
                  <a
                    href="/profile"
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Account Settings
                  </a>
                  <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Help
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-b-lg border-t border-slate-200"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <a
                href="/login"
                className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                Login
              </a>
            )}
            <a
              href="/builder"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium px-4 py-2 bg-gradient-to-r from-[#5A318F] to-[#D920B7] hover:from-[#4A2875] hover:to-[#C01AA3] text-white transition-all"
            >
              Start Now
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16 -mt-8">
            <h1 className="text-slate-900 mb-6 text-5xl md:text-7xl font-bold leading-tight">
              Your Website. Your Content. One Platform.
            </h1>

            <p className="text-slate-600 text-xl max-w-2xl mx-auto mb-10">
              Create stunning websites in minutes with our AI-assisted builder.
              No coding required. Professional templates, drag-and-drop
              simplicity, and powerful features all in one platform.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a
                href="/builder"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-8 bg-gradient-to-r from-[#5A318F] to-[#D920B7] hover:from-[#4A2875] hover:to-[#C01AA3] text-white transition-all"
              >
                Start Building Now
              </a>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-8 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all">
                View Demo
              </button>
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
                transition: isTransitioning
                  ? "transform 700ms ease-in-out"
                  : "none",
                paddingLeft: "0",
                paddingRight: "0",
              }}
            >
              {/* Clone last slide at the beginning */}
              <div className="flex-none w-[72%]">
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden group cursor-pointer mx-auto">
                  <img
                    src={showcaseWebsites[showcaseWebsites.length - 1].image}
                    alt={showcaseWebsites[showcaseWebsites.length - 1].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>

              {/* Original slides */}
              {showcaseWebsites.map((website) => (
                <div key={website.id} className="flex-none w-[72%]">
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden group cursor-pointer mx-auto">
                    <img
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
                  <img
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
                const actualIndex =
                  currentSlide < 0
                    ? showcaseWebsites.length - 1
                    : currentSlide >= showcaseWebsites.length
                      ? 0
                      : currentSlide;
                return (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`transition-all ${
                      index === actualIndex
                        ? "w-8 h-2 bg-white rounded-full"
                        : "w-2 h-2 bg-white/50 rounded-full hover:bg-white/75"
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
                <div
                  key={index}
                  className="p-8 border border-slate-200 hover:border-purple-300 transition-all duration-300 shadow-sm hover:shadow-lg rounded-xl bg-white"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5A318F] to-[#D920B7] flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-slate-900 mb-3 text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600">{feature.description}</p>
                </div>
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
                  editor.lunasites.com
                </div>
              </div>
            </div>

            {/* Video Container */}
            <div className="relative aspect-video bg-slate-50 group cursor-pointer">
              <img
                src={demoImage}
                alt="Website Editor Demo"
                className="w-full h-full object-cover"
              />

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <div className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                  <Play
                    className="w-8 h-8 text-purple-600 ml-1"
                    fill="currentColor"
                  />
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
            <h2 className="text-slate-900 mb-4 text-4xl md:text-5xl font-bold">
              Beautiful Templates for Every Need
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Start with a professionally designed template and make it your own
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((template) => (
              <div
                key={template.id}
                className="group overflow-hidden border border-slate-200 hover:border-purple-300 transition-all duration-300 hover:shadow-xl cursor-pointer rounded-xl bg-white"
              >
                <div className="relative overflow-hidden aspect-[4/3]">
                  <img
                    src={template.image}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/0" />

                  {/* Text Overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white mb-1 font-semibold">
                      {template.name}
                    </h3>
                    <p className="text-sm text-white/80">{template.category}</p>
                  </div>

                  {/* Hover Button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button className="bg-white text-slate-900 hover:bg-slate-100 px-4 py-2 rounded-md text-sm font-medium">
                      Use Template
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <a
              href="/themes"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-8 border border-purple-300 text-purple-600 hover:bg-purple-50 transition-all"
            >
              View All Templates
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-stone-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-slate-900 mb-4 text-4xl md:text-5xl font-bold">
              Loved by Creators Worldwide
            </h2>
            <p className="text-slate-600 text-lg">
              Join thousands of happy customers building their dreams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-8 border border-slate-200 rounded-xl bg-white"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-slate-700 mb-6">"{testimonial.content}"</p>
                <div>
                  <div className="text-slate-900 font-semibold">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-slate-500">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="p-12 text-center bg-gradient-to-br from-[#5A318F] to-[#D920B7] rounded-xl">
            <h2 className="text-white mb-4 text-3xl md:text-4xl font-bold">
              Ready to Build Your Dream Website?
            </h2>
            <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of creators and businesses who trust Luna Sites to
              power their online presence
            </p>
            <a
              href="/builder"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-8 bg-white text-[#5A318F] hover:bg-slate-100 transition-all"
            >
              Get Started Now
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <img
                  src={Logo}
                  alt="Luna Sites"
                  className="w-[130px]"
                />
              </div>
              <p className="text-slate-400">
                Build beautiful websites effortlessly with AI-powered tools
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="/themes"
                    className="hover:text-white transition-colors"
                  >
                    Templates
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Examples
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Community
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400">
              &copy; 2025 Luna Sites. All rights reserved.
            </p>
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
