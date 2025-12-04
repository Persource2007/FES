import { Link } from 'react-router-dom'
import {
  FaNewspaper,
  FaBook,
  FaDownload,
  FaExternalLinkAlt,
} from 'react-icons/fa'
import Header from '../components/Header'
import Footer from '../components/Footer'
import IndiaMap from '../components/IndiaMap'

function Home() {

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Masthead Banner */}
      <section className="relative w-full h-[500px] lg:h-[600px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/images/masthead-hero.jpg"
            alt="Commons in India - Natural landscape with river and mountains"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image doesn't exist yet
              e.target.style.display = 'none'
              e.target.parentElement.style.background = 'linear-gradient(to bottom right, #1e293b, #334155, #0f172a)'
            }}
          />
          {/* Overlay for better text readability with green tint */}
          <div className="absolute inset-0 bg-gradient-to-b from-green-900/50 via-green-800/40 to-green-900/60"></div>
        </div>
        
        {/* Content */}
        <div className="relative h-full flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="text-center max-w-4xl mx-auto text-white">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-lg">
                Commons in India: Stories of Impact and Local Heroes
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-slate-100 mb-8 drop-shadow-md">
                Discover the power of Commons and their profound impact on ecology and communities
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction to Commons */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-green-800 mb-6">
              What are Commons?
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p className="text-xl leading-relaxed">
                Commons are shared resources that belong to communities—natural resources like
                forests, water bodies, and grazing lands that are collectively managed and
                protected by local people. These resources are vital for ecological balance and
                community well-being.
              </p>
              <p className="text-lg leading-relaxed">
                In India, Commons play a crucial role in sustaining rural livelihoods, preserving
                biodiversity, and maintaining traditional knowledge systems. They represent a
                powerful model of community-driven conservation and sustainable resource management.
              </p>
              <p className="text-lg leading-relaxed">
                Through this platform, we celebrate the stories of local heroes who are protecting,
                restoring, and revitalizing Commons across India, showcasing their impact on both
                ecology and communities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-green-800 mb-4">
              Stories Across India
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Explore stories from different states and categories. Click on markers to view stories
              from each region.
            </p>
          </div>

          {/* Interactive India Map with built-in filters */}
          <IndiaMap />
        </div>
      </section>

      {/* News Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-green-800 mb-4">News & Updates</h2>
            <p className="text-xl text-gray-700">
              Stay informed about Commons, FES activities, and community initiatives
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Placeholder News Items */}
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 hover:border-green-300"
              >
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 h-48 flex items-center justify-center">
                  <FaNewspaper className="text-4xl text-green-600" />
                </div>
                <div className="p-6">
                  <div className="text-sm text-green-700 mb-2 font-medium">News Article</div>
                  <h3 className="text-xl font-semibold text-green-900 mb-3">
                    [News Title Placeholder]
                  </h3>
                  <p className="text-gray-700 mb-4">
                    [News excerpt placeholder. This will display a brief summary of the news
                    article...]
                  </p>
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 text-green-700 font-medium hover:text-green-800 transition-colors"
                  >
                    Read More <FaExternalLinkAlt className="text-sm" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/stories"
              className="inline-block bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors shadow-md hover:shadow-lg"
            >
              View All Stories
            </Link>
          </div>
        </div>
      </section>

      {/* Publications Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-green-800 mb-4">
              Featured Publications
            </h2>
            <p className="text-xl text-gray-700">
              Access reports, research papers, and publications about Commons
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Placeholder Publication Items */}
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 hover:border-green-300"
              >
                <div className="bg-gradient-to-br from-emerald-100 to-teal-100 h-48 flex items-center justify-center">
                  <FaBook className="text-4xl text-green-600" />
                </div>
                <div className="p-6">
                  <div className="text-sm text-green-700 mb-2 font-medium">Publication</div>
                  <h3 className="text-xl font-semibold text-green-900 mb-3">
                    [Publication Title Placeholder]
                  </h3>
                  <p className="text-gray-700 mb-4">
                    [Publication description placeholder. Brief summary of the publication
                    content...]
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">PDF, 2.5 MB</span>
                    <button className="inline-flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors text-sm font-medium">
                      <FaDownload className="text-sm" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Logos Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-green-800 mb-4">Our Partners</h2>
            <p className="text-xl text-gray-700">
              Organizations working with FES to protect and restore Commons
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
            {/* Placeholder Partner Logos */}
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="bg-green-50 rounded-lg p-6 h-32 flex items-center justify-center border border-green-200 hover:shadow-md hover:border-green-400 transition-all"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">Logo</div>
                  <div className="text-xs text-green-700">Partner {item}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Home
