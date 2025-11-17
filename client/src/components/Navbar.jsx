import React, { useContext, useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import { FiChevronDown } from 'react-icons/fi'

// Tạo ra một danh sách các liên kết điều hướng có khả năng nhận biết trang đang hoạt động và áp dụng kiểu dáng tương ứng.
const Navbar = ({ containerStyles, setMenuOpened }) => { // nhận containerStyles và setMenuOpened từ props
    const { axios } = useContext(ShopContext)
    const navigate = useNavigate()
    const [categories, setCategories] = useState([])
    const [showDropdown, setShowDropdown] = useState(false)

    // Fetch categories từ API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await axios.get("/api/category/list")
                if (data.success) {
                    setCategories(data.categories)
                }
            } catch (error) {
                console.error("Error fetching categories:", error)
            }
        }
        fetchCategories()
    }, [])

    // Dữ liệu liên kết điều hướng
    const navLinks = [
        { path: '/', title: 'Home' },
        { path: '/blogs', title: 'Blogs' },
        { path: '/testimonial', title: 'Testimonial' },
        { path: '/contact', title: 'Contact' },
    ]

    const handleCategoryClick = (slug) => {
        navigate(`/collection/${slug}`)
        setShowDropdown(false)
        setMenuOpened && setMenuOpened(false)
    }

    return (
        // Chứa các liên kết điều hướng với kiểu dáng dựa trên trạng thái hoạt động của chúng
        <nav className={`${containerStyles}`}>
            
            {/* Home Link */}
            <NavLink
                onClick={()=>setMenuOpened && setMenuOpened(false)}
                to="/"
                className={({ isActive }) => `
                    relative px-4 py-2 text-sm font-medium tracking-wide
                    transition-all duration-300 ease-in-out
                    ${isActive 
                        ? "text-gray-900" 
                        : "text-gray-600 hover:text-gray-900"
                    }
                    after:content-[''] after:absolute after:bottom-0 after:left-0 
                    after:w-full after:h-[2px] after:bg-gray-900
                    after:transform after:origin-left
                    ${isActive 
                        ? "after:scale-x-100" 
                        : "after:scale-x-0 hover:after:scale-x-100"
                    }
                    after:transition-transform after:duration-300 after:ease-out
                `}
            >
                Home
            </NavLink>

            {/* Collection Dropdown */}
            <div 
                className="relative"
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
            >
                <button
                    className="relative px-4 py-2 text-sm font-medium tracking-wide
                        transition-all duration-300 ease-in-out
                        text-gray-600 hover:text-gray-900
                        flex items-center gap-1
                        after:content-[''] after:absolute after:bottom-0 after:left-0 
                        after:w-full after:h-[2px] after:bg-gray-900
                        after:transform after:origin-left
                        after:scale-x-0 hover:after:scale-x-100
                        after:transition-transform after:duration-300 after:ease-out"
                >
                    Collection
                    <FiChevronDown className={`transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                    <div className="absolute top-full left-0 pt-2 w-[600px] z-50">
                        <div className="bg-white/95 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden border border-gray-200">
                            {/* Grid 2 rows x 3 columns */}
                            <div className="grid grid-cols-3 gap-4 p-4">
                                {categories.map((category) => (
                                    <button
                                        key={category._id}
                                        onClick={() => handleCategoryClick(category.slug)}
                                        className="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                                    >
                                        {/* Category Image */}
                                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                                            <img 
                                                src={category.image} 
                                                alt={category.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                        </div>
                                        {/* Category Name */}
                                        <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 transition-colors text-center">
                                            {category.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            
                            {/* View All Link */}
                            <div className="border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        navigate('/collection')
                                        setShowDropdown(false)
                                        setMenuOpened && setMenuOpened(false)
                                    }}
                                    className="w-full px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors text-center"
                                >
                                    View All Products →
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Testimonial & Contact Links */}
            {navLinks.slice(1).map((link) => (
                <NavLink
                    onClick={()=>setMenuOpened && setMenuOpened(false)} // đóng menu khi nhấp vào liên kết
                    key={link.title}
                    to={link.path}
                    // Áp dụng các lớp CSS dựa trên trạng thái hoạt động của liên kết
                    className={({ isActive }) => `
                        relative px-4 py-2 text-sm font-medium tracking-wide
                        transition-all duration-300 ease-in-out
                        ${isActive 
                            ? "text-gray-900" 
                            : "text-gray-600 hover:text-gray-900"
                        }
                        after:content-[''] after:absolute after:bottom-0 after:left-0 
                        after:w-full after:h-[2px] after:bg-gray-900
                        after:transform after:origin-left
                        ${isActive 
                            ? "after:scale-x-100" 
                            : "after:scale-x-0 hover:after:scale-x-100"
                        }
                        after:transition-transform after:duration-300 after:ease-out
                    `}
                >
                    {link.title}
                </NavLink>
            ))}
        </nav>
    )
}

export default Navbar