import type { Route } from "./+types/themes";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Available Themes - Luna Sites" },
    { name: "description", content: "Explore our collection of professional themes for your website." },
  ];
}

const themes = [
  {
    id: 1,
    name: "Business Pro",
    category: "Business",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2426&q=80",
    description: "Perfect for companies and professional businesses",
    features: ["Modern design", "Service sections", "Contact forms", "SEO optimized"]
  },
  {
    id: 2,
    name: "Creative Portfolio",
    category: "Portfolio",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80",
    description: "Ideal for artists, designers and creators",
    features: ["Photo galleries", "Minimalist design", "Smooth animations", "Responsive portfolio"]
  },
  {
    id: 3,
    name: "E-commerce",
    category: "Magazin",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
    description: "Fully functional online store",
    features: ["Shopping cart", "Online payments", "Product management", "Reviews and ratings"]
  },
  {
    id: 4,
    name: "Restaurant",
    category: "Restaurant",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
    description: "For restaurants and food services",
    features: ["Online menu", "Reservations", "Photo gallery", "Contact information"]
  },
  {
    id: 5,
    name: "Blog Personal",
    category: "Blog",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2672&q=80",
    description: "Perfect for bloggers and content creators",
    features: ["Article system", "Comments", "Search", "Archives and categories"]
  },
  {
    id: 6,
    name: "Fitness Studio",
    category: "Fitness",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
    description: "For fitness studios and personal trainers",
    features: ["Class schedule", "Online bookings", "Trainer profiles", "Membership pricing"]
  }
];

const categories = ["All", "Business", "Portfolio", "Store", "Restaurant", "Blog", "Fitness"];

export default function Themes() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="text-2xl font-bold text-[#0052de]">Luna Sites</a>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="/" className="text-gray-500 hover:text-[#0052de] px-3 py-2 rounded-md text-sm font-medium">Home</a>
                <a href="/themes" className="text-gray-900 hover:text-[#0052de] px-3 py-2 rounded-md text-sm font-medium">Themes</a>
                <a href="#" className="text-gray-500 hover:text-[#0052de] px-3 py-2 rounded-md text-sm font-medium">Pricing</a>
                <button className="bg-[#0052de] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                  Start Free
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Choose the Perfect Theme
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Explore our collection of professional themes, specially created for different types of businesses and personal projects.
            </p>
          </div>

          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0052de] focus:border-[#0052de]"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {themes.map((theme) => (
              <div key={theme.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={theme.image}
                    alt={theme.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{theme.name}</h3>
                    <span className="px-2 py-1 text-xs font-medium text-[#0052de] bg-blue-100 rounded-full">
                      {theme.category}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{theme.description}</p>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {theme.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex space-x-3">
                    <button className="flex-1 bg-[#0052de] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                      Preview
                    </button>
                    <button className="flex-1 border border-[#0052de] text-[#0052de] px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50">
                      Use Theme
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Can't find the perfect theme?</h2>
            <p className="text-gray-600 mb-6">
              We have over 500 themes available. Explore the entire collection or contact us for personalized suggestions.
            </p>
            <div className="flex justify-center space-x-4">
              <button className="bg-[#0052de] text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700">
                View All Themes
              </button>
              <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-50">
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-gray-800 mt-16">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8 xl:col-span-1">
              <h2 className="text-2xl font-bold text-white">Luna Sites</h2>
              <p className="text-gray-300 text-base">
                Create professional websites with ease. 
                Inspired by WordPress.com, but simpler and faster.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Product</h3>
                  <ul className="mt-4 space-y-4">
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Themes</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Features</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Pricing</a></li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Support</h3>
                  <ul className="mt-4 space-y-4">
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Documentation</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Guides</a></li>
                    <li><a href="#" className="text-base text-gray-300 hover:text-white">Contact</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8">
            <p className="text-base text-gray-400 xl:text-center">
              &copy; 2024 Luna Sites. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}