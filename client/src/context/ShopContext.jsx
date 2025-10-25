import React, { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

export const ShopContext = createContext();

const ShopContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const currency = import.meta.env.VITE_CURRENCY;
  const delivery_charges = 10;
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch All Products
  const fetchProducts = async () => {
    try {
      const { data } = await axios.get("/api/product/list");
      if (data.success) {
        setProducts(data.products);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Fetch User & Cart Data
  const fetchUser = async () => {
    try {
      const { data } = await axios.get("/api/user/is-auth");
      if (data.success) {
        setUser(data.user);
        setCartItems(data.user.cartData);
      } else {
        setUser(null);
        setCartItems({});
      }
    } catch {
      setUser(null);
      setCartItems({});
    }
  };

  // Fetch Admin
  const fetchAdmin = async () => {
    try {
      const { data } = await axios.get("/api/admin/is-auth");
      setIsAdmin(data.success);
    } catch {
      setIsAdmin(false);
    }
  };

  // Full Logout Logic
  const logoutUser = async () => {
    try {
      const { data } = await axios.post("/api/user/logout");
      if (data.success) {
        toast.success(data.message);
        setUser(null)
        setCartItems({})
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Login (handle after login)
  const handleLoginSuccess = async () => {
    await fetchUser();
    navigate("/");
  };

  // Add to Cart
  const addToCart = async (itemId, size) => {
    if (!size) return toast.error("Please select size first");
    let cartData = structuredClone(cartItems);
    cartData[itemId] = cartData[itemId] || {};
    cartData[itemId][size] = (cartData[itemId][size] || 0) + 1;
    setCartItems(cartData);

    if (user) {
      try {
        const { data } = await axios.post("/api/cart/add", { itemId, size });
        data.success ? toast.success(data.message) : toast.error(data.message);
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  // Update Cart Quantity
  const updateQuantity = async (itemId, size, quantity) => {
    let cartData = structuredClone(cartItems);
    cartData[itemId][size] = quantity;
    setCartItems(cartData);

    if (user) {
      try {
        const { data } = await axios.post("/api/cart/update", { itemId, size, quantity });
        data.success ? toast.success(data.message) : toast.error(data.message);
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  // Get Cart Count
  const getCartCount = () => {
    let count = 0;
    for (const itemId in cartItems) {
      for (const size in cartItems[itemId]) {
        count += cartItems[itemId][size];
      }
    }
    return count;
  };

  // Get Total Cart Amount
  const getCartAmount = () => {
    let total = 0;
    for (const itemId in cartItems) {
      const product = products.find((p) => p._id === itemId);
      if (!product) continue;
      for (const size in cartItems[itemId]) {
        total += product.offerPrice * cartItems[itemId][size];
      }
    }
    return total;
  };

  useEffect(() => {
    fetchUser();
    fetchProducts();
    fetchAdmin();
  }, []);

  const value = {
    navigate,
    fetchProducts,
    showUserLogin,
    setShowUserLogin,
    axios,
    currency,
    delivery_charges,
    products,
    user,
    isAdmin,
    setIsAdmin,
    cartItems,
    setCartItems,
    searchQuery,
    setSearchQuery,
    addToCart,
    updateQuantity,
    getCartCount,
    getCartAmount,
    logoutUser,
    handleLoginSuccess, // <--- call this after login
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export default ShopContextProvider;
