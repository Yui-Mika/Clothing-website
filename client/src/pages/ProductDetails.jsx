/* Hiển thị trang chi tiết sản phẩm (Single Product Page), bao gồm hình ảnh, thông tin, 
tùy chọn kích thước, nút thêm vào giỏ hàng, và các component con khác như mô tả và sản phẩm liên quan.*/
import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link, useParams } from "react-router-dom";
import ProductDescription from "../components/ProductDescription";
import ProductFeatures from "../components/ProductFeatures";
import { FaTruckFast } from "react-icons/fa6";
import { TbShoppingBagPlus, TbHeart, TbStarHalfFilled, TbStarFilled } from "react-icons/tb";
import RelatedProducts from "../components/RelatedProducts";

// Logic và truy cập dữ liệu
const ProductDetails = () => {
  const { products, navigate, currency, addToCart } = useContext(ShopContext);
  const { id } = useParams(); // lấy id của sản phẩm từ URL.

  const product = products.find((item) => item._id === id);
  const [image, setImage] = useState(null);
  const [size, setSize] = useState(null)

  // Đảm bảo rằng khi dữ liệu sản phẩm (product) được tải, hình ảnh chính (image) được đặt mặc định là hình ảnh đầu tiên trong danh sách (product.image[0]).
  useEffect(() => {
    if (product) {
      setImage(product.image[0]);
      // console.log(product);
    }
  }, [product]);

  // Hiển thị giao diện người dùng khi product tồn tại
  return (
    product && (
      <div className="max-padd-container py-16 pt-28 bg-primary">
        <p>
          {/* Hiển thị đường dẫn điều hướng, giúp người dùng biết họ đang ở đâu và dễ dàng quay lại các trang trước: 
          Home / Collection / {product.category} / {product.name} */}
          <Link to={"/"}>Home</Link> /
          <Link to={"/collection"}> Collection</Link> /
          <Link to={`/collection/${product.category}`}>
            {" "}
            {product.category}
          </Link>{" "}
          /<span className="text-secondary"> {product.name}</span>
        </p>
        {/* Phần Chính: Ảnh và Chi tiết (Flex Container) */}
        <div className="flex gap-10 flex-col xl:flex-row my-6"> {/* Sử dụng bố cục hai cột */}
          {/* Hiển thị hình ảnh - IMAGE */}
          <div className="flex flex-1 gap-x-2 max-w-[533px]">
            {/* Sidebar Thumbnail */}
            <div className="flex-1 flexCenter flex-col gap-[7px] flex-wrap">
              {product.image.map((item, i) => (
                <div key={i} className="bg-white">
                  <img
                    onClick={() => setImage(item)}
                    src={item}
                    alt="prdctImg"
                    className="object-cover aspect-square"
                  />
                </div>
              ))}
            </div>
            {/* Main Image */}
            <div className="flex-[4] flex bg-white">
              <img src={image} alt="prdctImg" />
            </div>
          </div>
          {/* Thông tin sản phẩm - PRODUCT INFO */}
          <div className="flex-1 px-5 py-3 bg-white">
            <h3 className="h3 leading-none">{product.name}</h3>
            {/* Tiêu đề, đánh giá, và giá - RATING & PRICE */}
            <div className="flex items-center gap-x-2 pt-2">
              <div className="flex gap-x-2 text-yellow-500">
                <TbStarFilled /> {/* Hiển thị 4.5 sao đánh giá cố định và số lượng đánh giá cố định là 22 */}
                <TbStarFilled />
                <TbStarFilled />
                <TbStarFilled />
                <TbStarHalfFilled />
              </div>
              <p className="medium-14">({22})</p> {/*  hard-coded values */}
            </div>
            <div className="h4 flex items-baseline gap-4 my-2">
              <h3 className="h3 line-through text-secondary">
                {currency}
                {product.price}.00
              </h3>
              <h4 className="h4">
                {" "}
                {currency}
                {product.offerPrice}.00
              </h4>
            </div>
            <p className="max-w-[555px]">{product.description}</p>
            <div className="flex flex-col gap-4 my-4 mb-5">
              {/* Kích thước sản phẩm - SIZE OPTIONS */}
              <div className="flex gap-2">
                {[...product.sizes] // sorting logical sizes
                  .sort((a, b) => {
                    const order = ["S", "M", "L", "XL", "XXL"];
                    return order.indexOf(a) - order.indexOf(b);
                  })
                  .map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setSize(item)}
                      className={`${
                        item === size 
                          ? "ring-1 ring-slate-900/20" // Trạng thái khi kích thước được chọn
                          : "ring-1 ring-slate-900/5"
                      } medium-14 h-8 w-10 bg-primary rounded-none`}
                    >
                      {item}
                    </button>
                  ))}
              </div>
            </div>
           {/* Nút hành động thêm vào giỏ hàng, yêu thích sản phẩm, và thông tin giao hàng miễn phí */}
            <div className="flex items-center gap-x-4">
              <button
                onClick={() => addToCart(product._id, size)}
                className="btn-dark  sm:w-1/2 flexCenter gap-x-2 capitalize"
              >
                Add to Cart <TbShoppingBagPlus />
              </button>
              <button className="btn-light ">
                <TbHeart className="text-xl"/>
              </button>
            </div>
            {/* Hiển thị các thông tin quan trọng như Giao hàng miễn phí (với biểu tượng xe tải FaTruckFast) và các cam kết của cửa hàng (Xác thực, COD, Đổi trả dễ dàng). */}
            <div className="flex items-center gap-x-2 mt-3">
              <FaTruckFast className="text-lg" />
              <span className="medium-14">
                Free Delivery on orders over 500$
              </span>
            </div>
            <hr className="my-3 w-2/3" />
            <div className="mt-2 flex flex-col gap-1 text-gray-30 text-[14px]">
              <p>Authenticy You Can Trust</p>
              <p>Enjoy Cash on Delivery for Your Convenience</p>
              <p>Easy Returns and Exchanges Within 7 Days</p>
            </div>
          </div>
        </div>
        {/* Phần dưới của trang tích hợp ba component con đã được mô tả trước đó: */}
        <ProductDescription /> {/* Hiển thị chi tiết sản phẩm theo tab (Mô tả, Hướng dẫn Chăm sóc, v.v.). */}
        <ProductFeatures /> {/* Hiển thị các tính năng/lợi ích cốt lõi của dịch vụ (Đổi trả, Giao hàng, Thanh toán). */}
        {/* Related Products */} 
        <RelatedProducts product={product} id={id} /> {/* Hiển thị các sản phẩm cùng danh mục. */}
      </div>
    )
  );
};

export default ProductDetails;
