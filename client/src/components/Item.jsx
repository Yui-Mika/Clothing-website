import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

// Hiển thị hình ảnh, tên, mô tả, danh mục và nút "Thêm vào giỏ hàng" cho một sản phẩm duy nhất.
const Item = ({ product }) => {
  // Truy cập addToCart (hàm thêm sản phẩm vào giỏ hàng) và Maps (hàm điều hướng trang) từ ShopContext.
  const { addToCart, navigate } = useContext(ShopContext);
  const [hovered, setHovered] = useState(false);

  return (
    <div className="overflow-hidden p-5 bg-white">
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
        className="flexCenter bg-[#f5f5f5] overflow-hidden relative"
      >
        <img
          src={ // logic để hiển thị hình ảnh thứ hai khi hover nếu có, ngược lại hiển thị hình ảnh đầu tiên
            product.image.length > 1 && hovered
              ? product.image[1] // hình ảnh thứ hai khi hover
              : product.image[0] // hình ảnh đầu tiên mặc định
          }
          alt="productImg"
          className="group-hover:bg-primaryDeep transition-all duration-300"
        />
      </div>
      {/* Hiển thị chi tiết sản phẩm và tương tác - INFO */}
      <div className="pt-3">
        <h4 className="bold-15 line-clamp-1 !py-0 uppercase">{product.name}</h4>
        <p className="line-clamp-1">{product.description}</p>
        <div className="flexBetween pt-2 gap-2">
          <p className="h5">{product.category}</p>
          {/* Nút "Thêm vào giỏ hàng" */}
          <button
            onClick={() => addToCart(product._id)}
            className="btn-outline  !py-2 !px-0 w-full !text-xs"
          >
            Add to Cart | ${product.offerPrice}.00  {/* hiển thị giá bán sản phẩm */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Item;
