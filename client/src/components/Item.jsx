import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { TbShoppingBagPlus } from "react-icons/tb";

// Hiển thị hình ảnh, tên, mô tả, danh mục và nút "Thêm vào giỏ hàng" cho một sản phẩm duy nhất.
const Item = ({ product }) => {
  // Truy cập addToCart (hàm thêm sản phẩm vào giỏ hàng) và Maps (hàm điều hướng trang) từ ShopContext.
  const { addToCart, navigate } = useContext(ShopContext);
  const [hovered, setHovered] = useState(false);

  // Calculate discount percentage
  const discountPercent = product.price && product.offerPrice 
    ? Math.round(((product.price - product.offerPrice) / product.price) * 100)
    : 0;

  return (
    <div 
      className="group overflow-hidden rounded-xl bg-white shadow-md hover:shadow-2xl 
                 transition-all duration-500 border border-gray-100 hover:border-gray-300"
    >
      {/* Hiển thị hình ảnh - IMAGE */}
      <div
        onClick={() => { // Chuyển hướng đến trang chi tiết sản phẩm khi nhấp vào hình ảnh
          navigate(
            `/collection/${product.category.toLocaleLowerCase()}/${product._id}`
          );
          window.scrollTo(0, 0);
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 
                   aspect-[3/4] cursor-pointer"
      >
        <img
          src={ // logic để hiển thị hình ảnh thứ hai khi hover nếu có, ngược lại hiển thị hình ảnh đầu tiên
            product.image.length > 1 && hovered
              ? product.image[1] // hình ảnh thứ hai khi hover
              : product.image[0] // hình ảnh đầu tiên mặc định
          }
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 
                     group-hover:scale-110"
        />
        
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 
                         rounded-full text-xs font-semibold shadow-lg">
            -{discountPercent}%
          </div>
        )}

        {/* Quick Add Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 
                       transition-all duration-300 flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product._id);
            }}
            className="translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100
                     transition-all duration-300 bg-white text-gray-900 px-6 py-3 rounded-full
                     font-medium text-sm flex items-center gap-2 hover:bg-gray-900 hover:text-white
                     shadow-xl"
          >
            <TbShoppingBagPlus className="text-lg" />
            Quick Add
          </button>
        </div>
      </div>

      {/* Hiển thị chi tiết sản phẩm và tương tác - INFO */}
      <div className="p-4">
        {/* Category Badge */}
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">
          {product.category}
        </p>
        
        {/* Product Name */}
        <h4 className="font-semibold text-gray-900 line-clamp-1 mb-1 text-base">
          {product.name}
        </h4>
        
        {/* Product Description */}
        <p className="text-sm text-gray-500 line-clamp-2 mb-3 min-h-[40px]">
          {product.description}
        </p>
        
        {/* Price Section */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-bold text-gray-900">
            ${product.offerPrice}.00
          </span>
          {product.price && product.price > product.offerPrice && (
            <span className="text-sm text-gray-400 line-through">
              ${product.price}.00
            </span>
          )}
        </div>

        {/* Add to Cart Button - Bottom */}
        <button
          onClick={() => addToCart(product._id)}
          className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-medium text-sm
                   hover:bg-gray-800 active:scale-95 transition-all duration-200 
                   flex items-center justify-center gap-2 shadow-md"
        >
          <TbShoppingBagPlus className="text-lg" />
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default Item;
