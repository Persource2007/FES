import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FaSearch,
  FaNewspaper,
  FaBook,
  FaUsers,
  FaEnvelope,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaChartLine,
  FaGlobe,
  FaHeart,
  FaAward,
} from 'react-icons/fa'

function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [newsletterEmail, setNewsletterEmail] = useState('')

  // Dummy data for stories
  const featuredStories = [
    {
      id: 1,
      title: 'Empowering Educators Through Technology',
      category: 'Educator',
      excerpt: 'How innovative teaching methods are transforming classrooms and student outcomes across the globe.',
      image: 'https://via.placeholder.com/400x250',
      date: 'December 1, 2025',
    },
    {
      id: 2,
      title: 'Breaking Barriers in Education',
      category: 'Educator',
      excerpt: 'A comprehensive look at how educational programs are making a difference in underserved communities.',
      image: 'https://via.placeholder.com/400x250',
      date: 'November 28, 2025',
    },
    {
      id: 3,
      title: 'Innovation in Learning',
      category: 'Educator',
      excerpt: 'Exploring new approaches to education that are reshaping how students learn and teachers teach.',
      image: 'https://via.placeholder.com/400x250',
      date: 'November 25, 2025',
    },
    {
      id: 4,
      title: 'Community Impact Stories',
      category: 'Newswire',
      excerpt: 'Latest updates on community initiatives and their positive impact on local education systems.',
      image: 'https://via.placeholder.com/400x250',
      date: 'November 22, 2025',
    },
  ]

  // Dummy data for news
  const latestNews = [
    {
      id: 1,
      title: 'New Partnership Announced',
      excerpt: 'We are excited to announce a new strategic partnership that will expand our reach.',
      date: 'December 1, 2025',
      category: 'News',
    },
    {
      id: 2,
      title: 'Annual Report Released',
      excerpt: 'Our annual impact report showcases the incredible work done this year.',
      date: 'November 28, 2025',
      category: 'News',
    },
    {
      id: 3,
      title: 'Upcoming Event: Education Summit',
      excerpt: 'Join us for our annual education summit featuring keynote speakers and workshops.',
      date: 'November 25, 2025',
      category: 'News',
    },
  ]

  // Dummy data for publications
  const publications = [
    {
      id: 1,
      title: 'Research on Educational Outcomes',
      author: 'Dr. Jane Smith',
      date: '2025',
      type: 'Research Paper',
    },
    {
      id: 2,
      title: 'Best Practices in Teaching',
      author: 'Prof. John Doe',
      date: '2025',
      type: 'Guide',
    },
    {
      id: 3,
      title: 'Annual Impact Report 2025',
      author: 'FES Team',
      date: '2025',
      type: 'Report',
    },
  ]

  // Dummy data for partners
  const partners = [
    { id: 1, name: 'Education Foundation', logo: 'https://via.placeholder.com/150x80' },
    { id: 2, name: 'Global Learning Initiative', logo: 'https://via.placeholder.com/150x80' },
    { id: 3, name: 'Tech for Education', logo: 'https://via.placeholder.com/150x80' },
    { id: 4, name: 'Community Partners', logo: 'https://via.placeholder.com/150x80' },
    { id: 5, name: 'Innovation Hub', logo: 'https://via.placeholder.com/150x80' },
    { id: 6, name: 'Future Leaders', logo: 'https://via.placeholder.com/150x80' },
  ]

  // Impact stats
  const impactStats = [
    { icon: FaUsers, value: '10,000+', label: 'Educators Reached' },
    { icon: FaGlobe, value: '50+', label: 'Countries' },
    { icon: FaHeart, value: '1M+', label: 'Lives Impacted' },
    { icon: FaAward, value: '500+', label: 'Programs' },
  ]

  const handleSearch = (e) => {
    e.preventDefault()
    // Placeholder - no functionality
    console.log('Search:', searchQuery)
  }

  const handleNewsletterSubmit = (e) => {
    e.preventDefault()
    // Placeholder - no functionality
    console.log('Newsletter signup:', newsletterEmail)
    setNewsletterEmail('')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-slate-800">FES Stories</div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/about"
                className="text-gray-700 hover:text-slate-800 font-medium transition-colors"
              >
                About
              </Link>
              <Link
                to="/stories"
                className="text-gray-700 hover:text-slate-800 font-medium transition-colors"
              >
                Stories
              </Link>
              <Link
                to="/partners"
                className="text-gray-700 hover:text-slate-800 font-medium transition-colors"
              >
                Partners
              </Link>
              <Link
                to="/news"
                className="text-gray-700 hover:text-slate-800 font-medium transition-colors"
              >
                News
              </Link>
              <Link
                to="/publications"
                className="text-gray-700 hover:text-slate-800 font-medium transition-colors"
              >
                Publications
              </Link>
              <Link
                to="/contact"
                className="text-gray-700 hover:text-slate-800 font-medium transition-colors"
              >
                Contact
              </Link>
              <Link
                to="/login"
                className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors font-medium"
              >
                Login
              </Link>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden text-gray-700">
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-50 to-gray-100 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
              Discover stories of impact
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-10">
              Explore our latest news and updates from educators, communities, and partners
              making a difference around the world.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stories, news, and publications..."
                  className="w-full px-6 py-4 pl-14 pr-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
                />
                <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors font-medium"
                >
                  Search
                </button>
              </div>
            </form>

            {/* CTA Button */}
            <Link
              to="/stories"
              className="inline-block bg-slate-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl"
            >
              Explore All Stories
            </Link>
          </div>
        </div>
      </section>

      {/* Impact Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {impactStats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                    <Icon className="text-2xl text-slate-700" />
                  </div>
                  <div className="text-4xl font-bold text-slate-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Stories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Featured Stories</h2>
            <p className="text-xl text-gray-600">
              Explore our latest news and updates from educators around the world
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredStories.map((story) => (
              <article
                key={story.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden"
              >
                <img
                  src={story.image}
                  alt={story.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                      {story.category}
                    </span>
                    <span className="text-sm text-gray-500">{story.date}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2">
                    {story.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{story.excerpt}</p>
                  <Link
                    to={`/stories/${story.id}`}
                    className="text-slate-700 font-semibold hover:text-slate-900 transition-colors inline-flex items-center"
                  >
                    Read More
                    <svg
                      className="ml-2 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/stories"
              className="inline-block bg-slate-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
            >
              View All Stories
            </Link>
          </div>
        </div>
      </section>

      {/* Latest News & Publications Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Latest News */}
            <div>
              <div className="flex items-center mb-8">
                <FaNewspaper className="text-3xl text-slate-700 mr-3" />
                <h2 className="text-3xl font-bold text-slate-900">Latest News</h2>
              </div>
              <div className="space-y-6">
                {latestNews.map((news) => (
                  <article
                    key={news.id}
                    className="border-l-4 border-slate-700 pl-6 py-2 hover:bg-gray-50 transition-colors rounded-r-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-700">{news.category}</span>
                      <span className="text-sm text-gray-500">{news.date}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{news.title}</h3>
                    <p className="text-gray-600">{news.excerpt}</p>
                    <Link
                      to={`/news/${news.id}`}
                      className="text-slate-700 font-semibold hover:text-slate-900 transition-colors inline-flex items-center mt-3"
                    >
                      Read More
                      <svg
                        className="ml-2 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </article>
                ))}
              </div>
              <div className="mt-6">
                <Link
                  to="/news"
                  className="text-slate-700 font-semibold hover:text-slate-900 transition-colors inline-flex items-center"
                >
                  View All News
                  <svg
                    className="ml-2 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Publications */}
            <div>
              <div className="flex items-center mb-8">
                <FaBook className="text-3xl text-slate-700 mr-3" />
                <h2 className="text-3xl font-bold text-slate-900">Publications</h2>
              </div>
              <div className="space-y-6">
                {publications.map((pub) => (
                  <article
                    key={pub.id}
                    className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-700 bg-white px-3 py-1 rounded-full">
                        {pub.type}
                      </span>
                      <span className="text-sm text-gray-500">{pub.date}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{pub.title}</h3>
                    <p className="text-gray-600 mb-3">By {pub.author}</p>
                    <Link
                      to={`/publications/${pub.id}`}
                      className="text-slate-700 font-semibold hover:text-slate-900 transition-colors inline-flex items-center"
                    >
                      Read Publication
                      <svg
                        className="ml-2 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </article>
                ))}
              </div>
              <div className="mt-6">
                <Link
                  to="/publications"
                  className="text-slate-700 font-semibold hover:text-slate-900 transition-colors inline-flex items-center"
                >
                  View All Publications
                  <svg
                    className="ml-2 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Partners</h2>
            <p className="text-xl text-gray-600">
              Working together to create lasting impact in education
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow flex items-center justify-center"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-w-full h-auto opacity-70 hover:opacity-100 transition-opacity"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* About */}
            <div>
              <h3 className="text-lg font-bold mb-4">About FES Stories</h3>
              <p className="text-gray-300 text-sm">
                Discover stories of impact from educators, communities, and partners making a
                difference around the world.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/stories" className="text-gray-300 hover:text-white transition-colors">
                    Stories
                  </Link>
                </li>
                <li>
                  <Link to="/news" className="text-gray-300 hover:text-white transition-colors">
                    News
                  </Link>
                </li>
                <li>
                  <Link
                    to="/publications"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Publications
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-lg font-bold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/partners" className="text-gray-300 hover:text-white transition-colors">
                    Partners
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-300 hover:text-white transition-colors">
                    Login
                  </Link>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="text-lg font-bold mb-4">Newsletter</h3>
              <p className="text-gray-300 text-sm mb-4">
                Stay updated with our latest stories and news.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 text-white placeholder-gray-400 border border-slate-700 focus:outline-none focus:border-slate-600"
                />
                <button
                  type="submit"
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors font-medium"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Social Links & Copyright */}
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-gray-400 text-sm">
                  © 2025 FES Stories. All rights reserved.
                </p>
              </div>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <FaFacebook className="text-xl" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <FaTwitter className="text-xl" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin className="text-xl" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <FaInstagram className="text-xl" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
