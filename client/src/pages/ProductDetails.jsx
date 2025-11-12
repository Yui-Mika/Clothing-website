import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link, useParams } from "react-router-dom";
import ProductDescription from "../components/ProductDescription";
import ProductFeatures from "../components/ProductFeatures";
import { FaTruckFast } from "react-icons/fa6";
import { TbShoppingBagPlus, TbHeart, TbHeartFilled, TbStarHalfFilled, TbStarFilled, TbStar } from "react-icons/tb";
import RelatedProducts from "../components/RelatedProducts";
import toast from "react-hot-toast";
import axios from "axios";

const ProductDetails = () => {
  const { products, navigate, currency, addToCart, user, addToWishlist, removeFromWishlist, checkInWishlist } = useContext(ShopContext);
  const { id } = useParams();

  const product = products.find((item) => item._id === id);
  const [image, setImage] = useState(null);
  const [size, setSize] = useState(null);
  const [inWishlist, setInWishlist] = useState(false); // Track wishlist status
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  // Check if product is in wishlist when component loads
  useEffect(() => {
    if (user && product) {
      checkInWishlist(product._id).then(result => setInWishlist(result));
    } else {
      setInWishlist(false);
    }
  }, [user, product]);

  useEffect(() => {
    if (product) {
      setImage(product.image[0]);
      // console.log(product);
    }
  }, [product]);

  // Fetch review statistics for the product
  const fetchReviewStats = async () => {
    if (!product) return;
    
    try {
      const response = await axios.get(`/api/review/product/${product._id}/stats`);
      if (response.data.success) {
        setReviewStats({
          averageRating: response.data.averageRating || 0,
          totalReviews: response.data.totalReviews || 0,
          ratingDistribution: response.data.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
      }
    } catch (error) {
      console.error("Error fetching review stats:", error);
      // Keep default values on error
      setReviewStats({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    }
  };

  // Fetch review stats when product changes
  useEffect(() => {
    fetchReviewStats();
  }, [product]);

  // Handle wishlist toggle (add/remove)
  const handleWishlistToggle = async () => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    if (inWishlist) {
      const success = await removeFromWishlist(product._id);
      if (success) {
        setInWishlist(false);
      }
    } else {
      const success = await addToWishlist(product._id);
      if (success) {
        setInWishlist(true);
      }
    }
  };

  // Render stars based on rating (0-5)
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<TbStarFilled key={`full-${i}`} />);
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<TbStarHalfFilled key="half" />);
    }

    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<TbStar key={`empty-${i}`} />);
    }

    return stars;
  };

  return (
    product && (
      <div className="max-padd-container py-16 pt-28 bg-primary">
        <p>
          <Link to={"/"}>Home</Link> /
          <Link to={"/collection"}> Collection</Link> /
          <Link to={`/collection/${product.category}`}>
            {" "}
            {product.category}
          </Link>{" "}
          /<span className="text-secondary"> {product.name}</span>
        </p>
        {/* PRODUCT DATA */}
        <div className="flex gap-10 flex-col xl:flex-row my-6">
          {/* IMAGE */}
          <div className="flex flex-1 gap-x-2 max-w-[533px]">
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
            <div className="flex-[4] flex bg-white">
              <img src={image} alt="prdctImg" />
            </div>
          </div>
          {/* PRODUCT INFO */}
          <div className="flex-1 px-5 py-3 bg-white">
            <h3 className="h3 leading-none">{product.name}</h3>
            {/* RATING & PRICE */}
            <div className="flex items-center gap-x-2 pt-2">
              <div className="flex gap-x-2 text-yellow-500">
                {renderStars(reviewStats.averageRating)}
              </div>
              <p className="medium-14">
                {reviewStats.totalReviews > 0 
                  ? `(${reviewStats.totalReviews})` 
                  : '(No reviews yet)'}
              </p>
            </div>

            {/* PRICE DISPLAY WITH DISCOUNT LOGIC */}
            {product.hasDiscount ? (
              <div className="my-3">
                {/* Discount Badge */}
                <div className="inline-flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-md">
                    GIẢM GIÁ {product.discountPercent}%
                  </span>
                  {product.discountEndDate && (
                    <span className="text-xs text-gray-500">
                      Kết thúc: {new Date(product.discountEndDate).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
                {/* Price with discount */}
                <div className="flex items-baseline gap-3">
                  <h3 className="h3 text-red-600 font-bold">
                    {currency}
                    {product.offerPrice.toLocaleString()}
                  </h3>
                  <h4 className="h4 line-through text-gray-400">
                    {currency}
                    {product.price.toLocaleString()}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Tiết kiệm: {currency}
                  {(product.price - product.offerPrice).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="my-3">
                <h3 className="h3 text-gray-900 font-bold">
                  {currency}
                  {product.price.toLocaleString()}
                </h3>
              </div>
            )}
            <p className="max-w-[555px]">{product.description}</p>
            <div className="flex flex-col gap-4 my-4 mb-5">
              <div className="flex gap-2">
                {[...product.sizes]
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
                          ? "ring-1 ring-slate-900/20"
                          : "ring-1 ring-slate-900/5"
                      } medium-14 h-8 w-10 bg-primary rounded-none`}
                    >
                      {item}
                    </button>
                  ))}
              </div>
            </div>
            <div className="flex items-center gap-x-4">
              <button
                onClick={() => addToCart(product._id, size)}
                className="btn-dark  sm:w-1/2 flexCenter gap-x-2 capitalize"
              >
                Add to Cart <TbShoppingBagPlus />
              </button>
              <button 
                onClick={handleWishlistToggle}
                className={`btn-light ${inWishlist ? 'bg-red-50 border-red-200' : ''}`}
                title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                {inWishlist ? (
                  <TbHeartFilled className="text-xl text-red-500" />
                ) : (
                  <TbHeart className="text-xl" />
                )}
              </button>
            </div>
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
        <ProductDescription product={product} />
        <ProductFeatures />
        {/* Related Products */}
        <RelatedProducts product={product} id={id} />
      </div>
    )
  );
};

export default ProductDetails;
