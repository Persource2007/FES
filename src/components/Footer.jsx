import { Link } from 'react-router-dom'
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa'

function Footer() {
  const handleNewsletterSubmit = (e) => {
    e.preventDefault()
    // TODO: Implement newsletter subscription
    alert('Newsletter subscription coming soon!')
  }

  return (
    <footer className="bg-green-900 text-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* About */}
          <div>
            <h3 className="text-base font-bold mb-2">About</h3>
            <p className="text-green-100 text-xs">
              Discover stories of impact from communities and partners making a
              difference around the world.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-bold mb-2">Quick Links</h3>
            <ul className="space-y-1 text-xs">
              <li>
                <Link to="/stories" className="text-green-200 hover:text-white transition-colors">
                  Stories
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-green-200 hover:text-white transition-colors">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-base font-bold mb-2">Newsletter</h3>
            <p className="text-green-100 text-xs mb-2">
              Stay updated with our latest stories and news.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <input
                type="email"
                placeholder="Your email address"
                disabled
                className="w-full px-3 py-1.5 text-sm rounded-lg bg-green-800 text-white placeholder-green-300 border border-green-700 focus:outline-none focus:border-green-600 opacity-50 cursor-not-allowed"
              />
              <button
                type="submit"
                disabled
                className="w-full bg-green-700 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-green-600 transition-colors font-medium opacity-50 cursor-not-allowed"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="border-t border-green-800 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-2 md:mb-0">
              <p className="text-green-200 text-xs">
                © {new Date().getFullYear()} Stories from the Commons. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-3">
              <a
                href="#"
                className="text-green-300 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <FaFacebook className="text-lg" />
              </a>
              <a
                href="#"
                className="text-green-300 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <FaTwitter className="text-lg" />
              </a>
              <a
                href="#"
                className="text-green-300 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="text-lg" />
              </a>
              <a
                href="#"
                className="text-green-300 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram className="text-lg" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

