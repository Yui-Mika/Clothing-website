import { Link } from "react-router-dom";

const Footer = () => {
  const linkSections = [
    {
      title: "Quick Links",
      links: ["Home", "Best Sellers", "Offers & Deals", "Contact Us", "FAQs"],
    },
    {
      title: "Need Help?",
      links: [
        "Delivery Information",
        "Return & Refund Policy",
        "Payment Methods",
        "Track your Order",
        "Contact Us",
      ],
    },
    {
      title: "Follow Us",
      links: ["Instagram", "Twitter", "Facebook", "YouTube"],
    },
  ];

  return (
    <footer className="max-padd-container bg-gradient-to-l from-primary via-white to-primary">
      <div className="flex flex-col md:flex-row items-start justify-between gap-10 py-10 border-b border-gray-500/30">
        <div>
         <Link to={"/"} className="bold-22 uppercase font-paci">Shopprr <span className="text-secondary bold-28">.</span>
                    </Link>
          <p className="max-w-[410px] mt-6">
           Discover stylish clothing and shoes online, crafted for comfort and quality. Shop fashion-forward designs that elevate your look and fit every lifestyle.
          </p>
        </div>
        <div className="flex flex-wrap justify-between w-full md:w-[45%] gap-5">
          {linkSections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-base md:mb-5 mb-2">
                {section.title}
              </h3>
              <ul className="text-sm space-y-2">
                {section.links.map((link, i) => (
                  <li key={i}>
                    <Link to="/" className="hover:underline transition">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <p className="py-4 text-center">
        Copyright 2025 © CodeAtUsman All Right Reserved.
      </p>
    </footer>
  );
};

export default Footer
