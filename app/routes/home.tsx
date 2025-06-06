import type { Route } from "./+types/home";

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src="/app/welcome/logo_mini.png"
                alt="Luna Sites"
                className="w-10 h-10"
              />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0052de] to-blue-700 bg-clip-text text-transparent">
                Luna Sites
              </h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-1">
                <a
                  href="/"
                  className="text-gray-900 hover:text-[#0052de] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Home
                </a>
                <a
                  href="/themes"
                  className="text-gray-600 hover:text-[#0052de] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Themes
                </a>
                <a
                  href="#features"
                  className="text-gray-600 hover:text-[#0052de] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  className="text-gray-600 hover:text-[#0052de] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Pricing
                </a>
                <button className="bg-gradient-to-r from-[#0052de] to-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-blue-800 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl">
                  Start Free
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-[#0052de]/10 to-blue-50/30"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-[#0052de]/20 to-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
            <div className="text-center">
              <div className="mb-8">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-[#0052de] mb-8">
                  🚀 New: AI-powered themes available now
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-8 leading-tight">
                <span className="block">Build</span>
                <span className="block bg-gradient-to-r from-[#0052de] via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  the perfect website
                </span>
                <span className="block text-4xl md:text-5xl font-semibold text-gray-700 mt-4">
                  in minutes
                </span>
              </h1>

              <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600 leading-relaxed">
                With <strong>Luna Sites</strong>, creating a professional
                website becomes a joy. Choose from a vast collection of{" "}
                <strong>500+ modern themes</strong>, customize everything with
                drag & drop and publish online instantly.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href="/themes"
                  className="group inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-[#0052de] to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
                >
                  <span>Explore Themes</span>
                  <svg
                    className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </a>
                <button className="inline-flex items-center px-8 py-4 text-lg font-semibold text-gray-700 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:text-[#0052de] transition-all duration-300 shadow-md hover:shadow-lg">
                  <svg
                    className="mr-2 w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Live Demo
                </button>
              </div>

              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">No code required</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">Hosting included</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-base font-semibold text-[#0052de] tracking-wide uppercase mb-2">
                Our simple process
              </h2>
              <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                From idea to website in 3 steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="relative text-center group">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 w-8 h-8 bg-[#0052de] text-white rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 pt-12 border border-blue-100 group-hover:border-blue-200 transition-all duration-300 group-hover:shadow-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#0052de] to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-5L9 9v12z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Choose a Theme
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Browse through 500+ professional themes and find the perfect
                    one for your business.
                  </p>
                </div>
              </div>

              <div className="relative text-center group">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 w-8 h-8 bg-[#0052de] text-white rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 pt-12 border border-blue-100 group-hover:border-blue-200 transition-all duration-300 group-hover:shadow-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#0052de] to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 011 1v1z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Customize
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Use our intuitive drag & drop editor to customize your
                    website exactly as you want it.
                  </p>
                </div>
              </div>

              <div className="relative text-center group">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 w-8 h-8 bg-[#0052de] text-white rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 pt-12 border border-blue-100 group-hover:border-blue-200 transition-all duration-300 group-hover:shadow-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#0052de] to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Publish Live
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    One click and your website is live on the internet, with
                    fast hosting and SSL security included.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="py-24 bg-gradient-to-br from-gray-50 to-blue-50"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-base font-semibold text-[#0052de] tracking-wide uppercase mb-2">
                Premium features
              </h2>
              <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
                Everything you need for online success
              </p>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Luna Sites is not just a website builder - it's a complete
                platform for your online presence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0052de] to-blue-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-5L9 9v12z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  500+ Professional Themes
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Vast collection of modern and responsive themes, created by
                  professional designers for any industry.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Ultra-Fast Performance
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Optimized hosting with global CDN, loading under 2 seconds and
                  99.9% guaranteed uptime.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0052de] to-blue-800 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  100% Mobile Responsive
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  All themes adapt perfectly to any device - desktop, tablet or
                  smartphone.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Enterprise Security
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Free SSL, daily automatic backup, DDoS protection and 24/7
                  monitoring for maximum security.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-[#0052de] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Analytics & SEO
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Track visitors with integrated Google Analytics and optimize
                  for search engines.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0052de] to-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Expert Support 24/7
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Our team of experts is available around the clock via chat,
                  email and phone.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-base font-semibold text-[#0052de] tracking-wide uppercase mb-2">
                Our theme store
              </h2>
              <p className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
                Themes for any industry
              </p>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From local businesses to complex online stores - we have the
                perfect theme for you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="aspect-w-16 aspect-h-10">
                  <img
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
                    alt="Business Theme"
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">
                    Business Professional
                  </h3>
                  <p className="text-sm opacity-90">
                    Perfect for consulting and services
                  </p>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="aspect-w-16 aspect-h-10">
                  <img
                    src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
                    alt="E-commerce Theme"
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">E-commerce Pro</h3>
                  <p className="text-sm opacity-90">
                    Fully functional online store
                  </p>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="aspect-w-16 aspect-h-10">
                  <img
                    src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
                    alt="Restaurant Theme"
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">Restaurant Elite</h3>
                  <p className="text-sm opacity-90">
                    For restaurants and catering
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <a
                href="/themes"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-[#0052de] to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <span>View All Themes (500+)</span>
                <svg
                  className="ml-2 w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </a>
            </div>
          </div>
        </section>

        <section className="py-24 bg-gradient-to-br from-[#0052de] via-blue-900 to-cyan-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-6xl font-extrabold mb-6">
              Ready to turn your
              <span className="block text-yellow-400">dream into reality?</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join <strong>50,000+</strong> entrepreneurs who built their online
              presence with Luna Sites. Start free today and see the magic!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <a
                href="/themes"
                className="inline-flex items-center px-8 py-4 text-lg font-bold text-[#0052de] bg-white rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                <span>Start Free Now</span>
                <svg
                  className="ml-2 w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </a>
              <button className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-xl hover:border-white hover:bg-white/10 transition-all duration-300">
                <svg
                  className="mr-2 w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Schedule Demo
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  500+
                </div>
                <div className="text-sm text-gray-300">Premium Themes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  50K+
                </div>
                <div className="text-sm text-gray-300">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  99.9%
                </div>
                <div className="text-sm text-gray-300">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  24/7
                </div>
                <div className="text-sm text-gray-300">Expert Support</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8 xl:col-span-1">
              <div className="flex items-center space-x-3">
                <img
                  src="/app/welcome/luna-sites-high-resolution-logo.svg.svg"
                  alt="Luna Sites"
                  className="w-10 h-10 filter brightness-0 invert"
                />
                <h2 className="text-2xl font-bold text-white">Luna Sites</h2>
              </div>
              <p className="text-base leading-relaxed">
                Create professional websites with ease. Inspired by
                WordPress.com, but simpler, faster and more powerful.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                    Product
                  </h3>
                  <ul className="space-y-3">
                    <li>
                      <a
                        href="/themes"
                        className="hover:text-white transition-colors"
                      >
                        Premium Themes
                      </a>
                    </li>
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
                        href="#pricing"
                        className="hover:text-white transition-colors"
                      >
                        Pricing
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Integrations
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                    Support
                  </h3>
                  <ul className="space-y-3">
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Help Center
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Documentation
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Tutorials
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Contact
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                    Company
                  </h3>
                  <ul className="space-y-3">
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        About Us
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Blog
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Careers
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Partners
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                    Legal
                  </h3>
                  <ul className="space-y-3">
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Privacy
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Terms
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        Cookies
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="hover:text-white transition-colors"
                      >
                        GDPR
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8">
            <p className="text-base text-center">
              &copy; 2024 Luna Sites. All rights reserved. Made with ❤️ in EU.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
