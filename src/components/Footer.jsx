import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa'

function Footer() {
  return (
    <footer className="bg-green-900 text-white py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Social Links & Copyright */}
        <div>
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

