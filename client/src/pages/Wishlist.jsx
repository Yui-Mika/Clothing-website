// Trang hiển thị danh sách sản phẩm yêu thích của user
import { useContext, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import { TbHeartOff, TbTrash } from "react-icons/tb";
import Title from "../components/Title";

const Wishlist = () => {
  const { 
    wishlistProducts, 
    fetchWishlist, 
    removeFromWishlist, 
    navigate, 
    currency,
    user 
  } = useContext(ShopContext);

  // Load wishlist khi vào trang
  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  // Nếu chưa login, hiển thị thông báo
  if (!user) {
    return (
      <div className="max-padd-container py-28">
        <div className="flexCenter flex-col gap-4 py-20">
          <TbHeartOff className="text-6xl text-gray-400" />
          <p className="text-xl">Please login to view your wishlist</p>
          <button 
            onClick={() => navigate('/')} 
            className="btn-dark"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-padd-container py-16 pt-28 bg-primary">
      {/* TITLE */}
      <div className="mb-8">
        <Title 
          title1="MY" 
          title2="WISHLIST" 
        />
        <p className="text-gray-600 mt-2">
          You have {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'} in your wishlist
        </p>
      </div>

      {/* EMPTY STATE */}
      {wishlistProducts.length === 0 ? (
        <div className="flexCenter flex-col gap-4 py-20 bg-white rounded-xl">
          <TbHeartOff className="text-6xl text-gray-400" />
          <p className="text-xl text-gray-600">Your wishlist is empty</p>
          <p className="text-gray-500">Add products you love to save them for later</p>
          <button 
            onClick={() => navigate('/collection')} 
            className="btn-dark mt-4"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        /* WISHLIST GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistProducts.map((product) => (
            <WishlistItem 
              key={product._id} 
              product={product}
              onRemove={() => removeFromWishlist(product._id)}
              currency={currency}
              navigate={navigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Component hiển thị từng sản phẩm trong wishlist
const WishlistItem = ({ product, onRemove, currency, navigate }) => {
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* PRODUCT IMAGE */}
      <div 
        onClick={() => navigate(`/product/${product._id}`)}
        className="cursor-pointer relative overflow-hidden"
      >
        <img 
          src={product.image[0]} 
          alt={product.name} 
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" 
        />
        
        {/* DISCOUNT BADGE */}
        {product.hasDiscount && (
          <span className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 text-xs font-bold rounded-md shadow-md">
            -{product.discountPercent}%
          </span>
        )}

        {/* REMOVE BUTTON - Show on hover */}
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Prevent navigation
            onRemove();
          }}
          className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          title="Remove from wishlist"
        >
          <TbTrash className="text-lg text-red-500" />
        </button>
      </div>

      {/* PRODUCT INFO */}
      <div className="p-4">
        {/* Product Name */}
        <h4 
          onClick={() => navigate(`/product/${product._id}`)}
          className="font-medium line-clamp-2 cursor-pointer hover:text-secondary transition-colors mb-2 h-12"
        >
          {product.name}
        </h4>

        {/* Category */}
        <p className="text-sm text-gray-500 mb-2">{product.category}</p>
        
        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          {product.hasDiscount ? (
            <>
              <span className="text-lg font-bold text-red-600">
                {currency}{product.offerPrice.toLocaleString()}
              </span>
              <span className="text-sm line-through text-gray-400">
                {currency}{product.price.toLocaleString()}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-gray-900">
              {currency}{product.price.toLocaleString()}
            </span>
          )}
        </div>

        {/* Added Date */}
        <p className="text-xs text-gray-400 mb-3">
          Added on {formatDate(product.addedAt)}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button 
            onClick={() => navigate(`/product/${product._id}`)}
            className="flex-1 btn-dark py-2 text-sm"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
