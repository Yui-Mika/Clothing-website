import { Link } from "react-router-dom";
import { FaInstagram, FaTwitter, FaFacebookF, FaYoutube } from "react-icons/fa";

const Footer = () => {
  const linkSections = [
    {
      title: "Quick Links",
      links: [
        { name: "Home", path: "/" },
        { name: "Best Sellers", path: "/collection" },
        { name: "Offers & Deals", path: "/collection" },
        { name: "Contact Us", path: "/contact" },
        { name: "FAQs", path: "/contact" },
      ],
    },
    {
      title: "Need Help?",
      links: [
        { name: "Delivery Information", path: "/contact" },
        { name: "Return & Refund Policy", path: "/contact" },
        { name: "Payment Methods", path: "/contact" },
        { name: "Track your Order", path: "/my-orders" },
        { name: "Contact Us", path: "/contact" },
      ],
    },
  ];

  const socialLinks = [
    { icon: <FaInstagram />, name: "Instagram", url: "#" },
    { icon: <FaTwitter />, name: "Twitter", url: "#" },
    { icon: <FaFacebookF />, name: "Facebook", url: "#" },
    { icon: <FaYoutube />, name: "YouTube", url: "#" },
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="max-padd-container py-16">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-gray-700">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link 
              to={"/"} 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-block mb-6"
            >
              <h2 className="text-3xl font-bold tracking-wider">
                VELOURA<span className="text-gray-400"></span>
              </h2>
            </Link>
            <p className="text-gray-400 leading-relaxed mb-6 max-w-md">
              Discover stylish clothing and shoes online, crafted for comfort and quality. 
              Shop fashion-forward designs that elevate your look and fit every lifestyle.
            </p>
            
            {/* Social Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-4">Follow Us</h3>
              <div className="flex gap-3">
                {socialLinks.map((social, i) => (
                  <a
                    key={i}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white hover:text-black flexCenter transition-all duration-300"
                    aria-label={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Link Sections */}
          {linkSections.map((section, index) => (
            <div key={index}>
              <h3 className="text-base font-semibold mb-6 uppercase tracking-wide">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link, i) => (
                  <li key={i}>
                    <Link
                      to={link.path}
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2025 Veloura. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link 
              to="/contact" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-gray-500 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/contact" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-gray-500 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
