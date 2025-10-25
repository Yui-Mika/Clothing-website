import React, { useContext } from 'react'
import { NavLink } from 'react-router-dom'
// Tạo ra một danh sách các liên kết điều hướng có khả năng nhận biết trang đang hoạt động và áp dụng kiểu dáng tương ứng.
const Navbar = ({ containerStyles, setMenuOpened }) => { // nhận containerStyles và setMenuOpened từ props

    // Dữ liệu liên kết điều hướng
    const navLinks = [
        { path: '/', title: 'Home' },
        { path: '/collection', title: 'Collection' },
        { path: '/testimonial', title: 'Testimonial' },
        { path: '/contact', title: 'Contact' },
    ]

    return (
        // Chứa các liên kết điều hướng với kiểu dáng dựa trên trạng thái hoạt động của chúng
        <nav className={`${containerStyles}`}>
            
            {navLinks.map((link) => (
                <NavLink
                onClick={()=>setMenuOpened(false)} // đóng menu khi nhấp vào liên kết
                    key={link.title}
                    to={link.path}
                    // Áp dụng các lớp CSS dựa trên trạng thái hoạt động của liên kết
                    className={({ isActive }) => `
                        relative px-4 py-2 text-sm font-medium tracking-wide
                        transition-all duration-300 ease-in-out
                        ${isActive 
                            ? "text-tertiary" 
                            : "text-gray-600 hover:text-tertiary"
                        }
                        after:content-[''] after:absolute after:bottom-0 after:left-0 
                        after:w-full after:h-[2px] after:bg-tertiary
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