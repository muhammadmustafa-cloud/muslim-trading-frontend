import { FaBook, FaLightbulb, FaTrophy } from "react-icons/fa";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

function About() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <div className="bg-gray-100">
      <header className=" text-white py-2 fixed w-full z-10 ">
        <div className=" mt-4 mx-auto px-6 flex justify-between items-center">
          {/* Logo */}
          <div className="text-3xl font-bold">
            <a
              href="/"
              className="text-[#007AFF] hover:text-[#FF6A13] transition-all"
            >
              Coggno
            </a>
          </div>

          {/* Navbar Links for Larger Screens */}
          <nav className="hidden md:flex whitespace-nowrap items-center space-x-8 text-lg bg-gradient-to-r from-[#007AFF] to-[#00C6FF] rounded-full px-8 py-4 shadow-lg">
            <a href="#courses" className="hover:text-[#FF6A13] transition-all">
              Courses
            </a>
            <a
              href="#solutions"
              className="hover:text-[#FF6A13] transition-all"
            >
              Solutions
            </a>
            <a href="#products" className="hover:text-[#FF6A13] transition-all">
              Products
            </a>
            <a href="#pricing" className="hover:text-[#FF6A13] transition-all">
              Pricing
            </a>
            <a href="#about-us" className="hover:text-[#FF6A13] transition-all">
              About Us
            </a>
            <a
              href="#course-dispatch"
              className="hover:text-[#FF6A13] transition-all"
            >
              Course Dispatch
            </a>
            <a
              href="#unlock-prime"
              className="hover:text-[#FF6A13] bg-white rounded-full py-2 px-4 text-[#007AFF] transition-all"
            >
              Unlock Prime
            </a>
          </nav>

          {/* Call to Action Button */}
          {/* Call to Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Login Button */}
            <a
              href="#login"
              className="text-[#007AFF] py-2 px-2 rounded-full hover:bg-[#007AFF] hover:text-white transition-all duration-300"
            >
              Login
            </a>

            {/* Sign Up Button */}
            <a
              href="#signup"
              className="bg-[#007AFF] whitespace-nowrap text-white py-2 px-6 rounded-full hover:bg-[#0056b3] transition-all duration-300"
            >
              Sign Up
            </a>
          </div>

          {/* Hamburger Icon for Mobile */}
          <div className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? (
              <FaTimes size={30} className="text-white" />
            ) : (
              <FaBars size={30} className="text-white" />
            )}
          </div>
        </div>

        {/* Mobile Menu (Conditional rendering based on state) */}
        {isMenuOpen && (
          <div className="md:hidden bg-gradient-to-r from-[#007AFF] to-[#00C6FF] text-white absolute w-full top-16 left-0 py-6 flex flex-col items-center space-y-6">
            <a
              href="#courses"
              className="text-lg hover:text-[#FF6A13] transition-all"
            >
              Courses
            </a>
            <a
              href="#solutions"
              className="text-lg hover:text-[#FF6A13] transition-all"
            >
              Solutions
            </a>
            <a
              href="#products"
              className="text-lg hover:text-[#FF6A13] transition-all"
            >
              Products
            </a>
            <a
              href="#pricing"
              className="text-lg hover:text-[#FF6A13] transition-all"
            >
              Pricing
            </a>
            <a
              href="#about-us"
              className="text-lg hover:text-[#FF6A13] transition-all"
            >
              About Us
            </a>
            <a
              href="#course-dispatch"
              className="text-lg hover:text-[#FF6A13] transition-all"
            >
              Course Dispatch
            </a>
            <a
              href="#unlock-prime"
              className="text-lg hover:text-[#FF6A13] transition-all"
            >
              Unlock Prime
            </a>
            <a
              href="#login"
              className="text-lg hover:text-[#FF6A13] transition-all"
            >
              Login
            </a>
            <a
              href="#sign-up"
              className="text-lg hover:text-[#FF6A13] transition-all"
            >
              Sign Up
            </a>
            <a
              href="#cta"
              className="bg-[#FF6A13] text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition duration-300 ease-in-out"
            >
              Get Started
            </a>
          </div>
        )}
      </header>
      <div className="font-sans  mx-auto container py-10">
        {/* Hero Section */}
        <section className="relative mt-20 bg-gray-300 text-[#007AFF] py-20 rounded-xl shadow-xl">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 text-center md:text-left">
              <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
                About <span className="text-[#007AFF]">Coggno</span>
              </h1>
              <p className="mt-6 text-lg font-medium text-gray-600">
                Empowering organizations worldwide with cutting-edge online
                training solutions. From soft skills to compliance, we are your
                trusted partner in success.
              </p>
              <button className="mt-8 px-8 py-3 bg-[#007AFF] text-white font-semibold rounded-full shadow-lg hover:shadow-2xl transform hover:scale-105 transition duration-300 ease-in-out">
                Discover More
              </button>
            </div>
            <div className="md:w-1/2 mt-12 md:mt-0">
              <img
                src="/images/img2.png"
                alt="Hero Illustration"
                className=" w-full h-auto object-cover"
              />
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-16  rounded-t-lg">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-extrabold text-[#007AFF] mb-6">
              Why Choose Coggno?
            </h2>
            <p className="text-gray-600 text-lg mb-12">
              Empowering your team with the best learning tools for success.
            </p>
            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  icon: <FaBook size={60} />,
                  title: "10,000+ Courses",
                },
                {
                  icon: <FaLightbulb size={60} />,
                  title: "Easy to Use",
                },
                {
                  icon: <FaTrophy size={60} />,
                  title: "Trusted by Top Brands",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-10 shadow-lg w-64 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ease-in-out"
                >
                  <div className="w-24 h-24 bg-gradient-to-r from-[#007AFF] to-[#00C6FF] text-white rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-xl transform hover:scale-110 transition-all duration-300 ease-in-out">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {item.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vision and Mission Section */}
        <section className="py-16 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#ffffff]">
          <div className="max-w-6xl mx-auto px-6">
            {/* Vision Section */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-5xl font-bold text-gray-700 leading-tight">
                  Our Vision
                </h2>
                <p className="text-gray-700 mt-6 text-xl">
                  To redefine learning with innovative solutions, enabling
                  individuals and organizations to reach their full potential.
                </p>
              </div>
              <div className="relative group overflow-hidden">
                <img
                  src="/images/img3.png"
                  alt="Vision illustration"
                  className="rounded-xl transform transition duration-500 ease-in-out group-hover:scale-105"
                />
              </div>
            </div>

            {/* Mission Section */}
            <div className="grid md:grid-cols-2 gap-16 items-center mt-16">
              <div className="relative group overflow-hidden">
                <img
                  src="/images/img4.png"
                  alt="Mission illustration"
                  className="rounded-xl transform transition duration-500 ease-in-out group-hover:scale-105"
                />
              </div>
              <div>
                <h2 className="text-5xl font-bold text-gray-700 leading-tight">
                  Our Mission
                </h2>
                <p className="text-gray-700 mt-6 text-xl">
                  To provide world-class training solutions that meet the
                  dynamic needs of businesses and professionals everywhere.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Client Testimonials */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-extrabold text-[#007AFF] leading-tight mb-4">
              What Our Clients Say
            </h2>
            <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">
              Hear from the individuals and organizations that trust us to
              empower their teams.
            </p>
            <div className="mt-12 grid md:grid-cols-3 gap-16">
              {[
                {
                  text: "Coggno transformed our employee training process. The platform is easy to use, and our workforce loves it!",
                  name: "John Doe",
                  role: "HR Manager",
                  avatar: "https://randomuser.me/api/portraits/men/49.jpg",
                },
                {
                  text: "Their customer support and course variety are top-notch. Highly recommended!",
                  name: "Jane Smith",
                  role: "Operations Lead",
                  avatar: "https://randomuser.me/api/portraits/men/39.jpg",
                },
                {
                  text: "Coggno helped us meet compliance requirements effortlessly. Truly a lifesaver!",
                  name: "Sarah Lee",
                  role: "Compliance Officer",
                  avatar: "https://randomuser.me/api/portraits/women/49.jpg",
                },
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white rounded-3xl p-10 shadow-xl transform hover:scale-105 hover:shadow-2xl transition-all duration-500 ease-in-out"
                >
                  <p className="text-gray-700 italic text-lg mb-6">
                    &quot;{testimonial.text}&quot;
                  </p>
                  <div className="flex items-center justify-center mt-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-20 h-20 rounded-full border-4 border-[#007AFF] shadow-lg transition-all duration-300 transform hover:scale-110"
                    />
                    <div className="ml-6">
                      <p className="font-semibold text-[#007AFF] text-2xl">
                        {testimonial.name}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-[#FF9D42] to-[#FF6A13] text-white py-20 rounded-xl relative">
          <div className="max-w-6xl mx-auto px-6 text-center">
            {/* Heading with Styling */}
            <h2 className="text-5xl font-extrabold text-white leading-tight mb-6">
              Ready to Empower Your Team?
            </h2>
            <p className="text-lg text-gray-200 mb-8">
              Join thousands of organizations upgrading their workforce training
              with cutting-edge solutions.
            </p>

            {/* Button with Hover Effect and Smooth Transition */}
            <button className="px-10 py-4 bg-white text-[#007AFF] font-semibold rounded-full shadow-xl transform hover:scale-110 hover:bg-[#FF9D42] transition duration-300 ease-in-out">
              Start Now
            </button>

            {/* Decorative Element for Visual Appeal */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[120px] h-[120px] rounded-full bg-white opacity-20 blur-3xl"></div>
          </div>
        </section>
      </div>
      <footer className="bg-gradient-to-r from-[#007AFF] to-[#00C6FF] text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Column 1 - Logo and About Section */}
            <div>
              <h3 className="text-3xl font-semibold mb-4">Coggno</h3>
              <p className="text-lg mb-6">
                Empowering teams with the best online training tools. Our
                platform provides accessible learning solutions for businesses
                worldwide.
              </p>
              <div className="flex space-x-6">
                <a
                  href="#"
                  className="text-white text-2xl hover:text-[#FF6A13] transition-all"
                >
                  <FaFacebook />
                </a>
                <a
                  href="#"
                  className="text-white text-2xl hover:text-[#FF6A13] transition-all"
                >
                  <FaTwitter />
                </a>
                <a
                  href="#"
                  className="text-white text-2xl hover:text-[#FF6A13] transition-all"
                >
                  <FaLinkedin />
                </a>
                <a
                  href="#"
                  className="text-white text-2xl hover:text-[#FF6A13] transition-all"
                >
                  <FaInstagram />
                </a>
              </div>
            </div>

            {/* Column 2 - Quick Links */}
            <div>
              <h4 className="text-xl font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-4 text-lg">
                <li>
                  <a href="#" className="hover:text-[#FF6A13] transition-all">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#FF6A13] transition-all">
                    Courses
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#FF6A13] transition-all">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#FF6A13] transition-all">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3 - Newsletter */}
            <div>
              <h4 className="text-xl font-semibold mb-4">Newsletter</h4>
              <p className="text-lg mb-4">
                Stay updated with our latest news and courses.
              </p>
              <div className="flex flex-col space-y-4">
                <input
                  type="email"
                  placeholder="Your Email Address"
                  className="p-4 rounded-full text-black w-full"
                />
                <button className="px-6 py-3 bg-[#FF6A13] text-white font-semibold rounded-full hover:scale-105 transition duration-300 ease-in-out">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row - Copyright and Terms */}
          <div className="mt-12 text-center">
            <p className="text-lg">
              Developed by Time Global <br />
              <a
                href="#"
                className="text-white hover:text-[#FF6A13] transition-all"
              >
                Terms of Service
              </a>{" "}
              |
              <a
                href="#"
                className="text-white hover:text-[#FF6A13] transition-all"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default About;