import React, { useContext, useState } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";

const PlaceOrder = () => {
  const {
    navigate,
    cartItems,
    setCartItems,
    products,
    axios,
  } = useContext(ShopContext);
  const [method, setMethod] = useState("COD");

  const location = useLocation();
  const isOrderPage = location.pathname.includes("place-order");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  const onChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;

    setFormData((data) => ({ ...data, [name]: value }));
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    try {
      let orderItems = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            const itemInfo = structuredClone(
              products.find((product) => product._id === items)
            );
            if (itemInfo) {
              itemInfo.size = item;
              itemInfo.quantity = cartItems[items][item];
              orderItems.push(itemInfo);
            }
          }
        }
      }

      // Convert orderItems to items array for backend
      let items = orderItems.map(item => ({
        product: item._id,
        quantity: item.quantity,
        size: item.size
      }));

      if (method === "COD") {
        // Place order using COD
        const { data } = await axios.post("/api/order/cod", {
            items,
            address: formData,
        });
        if (data.success) {
            toast.success(data.message);
            setCartItems({});
            navigate("/my-orders");
        } else {
            toast.error(data.message);
        }
    } else {
        // Place order using Stripe
        const { data } = await axios.post("/api/order/stripe", {
            items,
            address: formData,
        });
        if (data.success) {
           window.location.replace(data.url)
        } else {
            toast.error(data.message);
        }
        
    }
} catch (error) {
    console.log(error)
    toast.error(error.message)
}
};

return (
    <div className="max-padd-container py-16 pt-28 bg-primary">
      {/* Container */}
      <form onSubmit={onSubmitHandler}>
        <div className="flex flex-col xl:flex-row gap-20 xl:gap-28">
          {/* Left Side */}
          <div className="flex flex-[2] flex-col gap-3 text-[95%]">
            <Title
              title1={"Delivery"}
              title2={"Information"}
              titleStyles={"pb-5"}
            />
            <div className="flex gap-3">
              <input
                onChange={onChangeHandler}
                value={formData.firstName}
                type="text"
                name="firstName"
                placeholder="First Name"
                className="ring-1 ring-slate-900/15  p-1 pl-3 rounded-sm bg-white outline-none w-1/2"
                required
              />
              <input
                onChange={onChangeHandler}
                value={formData.lastName}
                type="text"
                name="lastName"
                placeholder="Last Name"
                className="ring-1 ring-slate-900/15 p-1 pl-3 rounded-sm bg-white outline-none w-1/2"
                required
              />
            </div>
            <input
              onChange={onChangeHandler}
              value={formData.email}
              type="text"
              name="email"
              placeholder="Email"
              className="ring-1 ring-slate-900/15 p-1 pl-3 rounded-sm bg-white outline-none"
              required
            />
            <input
              onChange={onChangeHandler}
              value={formData.phone}
              type="text"
              name="phone"
              placeholder="Phone Number"
              className="ring-1 ring-slate-900/15 p-1 pl-3 rounded-sm bg-white outline-none"
              required
            />
            <input
              onChange={onChangeHandler}
              value={formData.street}
              type="text"
              name="street"
              placeholder="Street"
              className="ring-1 ring-slate-900/15 p-1 pl-3 rounded-sm bg-white outline-none"
              required
            />
            <div className="flex gap-3">
              <input
                onChange={onChangeHandler}
                value={formData.city}
                type="text"
                name="city"
                placeholder="City"
                className="ring-1 ring-slate-900/15  p-1 pl-3 rounded-sm bg-white outline-none w-1/2"
                required
              />
              <input
                onChange={onChangeHandler}
                value={formData.state}
                type="text"
                name="state"
                placeholder="State"
                className="ring-1 ring-slate-900/15 p-1 pl-3 rounded-sm bg-white outline-none w-1/2"
                required
              />
            </div>
            <div className="flex gap-3">
              <input
                onChange={onChangeHandler}
                value={formData.zipcode}
                type="text"
                name="zipcode"
                placeholder="Zip Code"
                className="ring-1 ring-slate-900/15  p-1 pl-3 rounded-sm bg-white outline-none w-1/2"
                required
              />
              <input
                onChange={onChangeHandler}
                value={formData.country}
                type="text"
                name="country"
                placeholder="Country"
                className="ring-1 ring-slate-900/15 p-1 pl-3 rounded-sm bg-white outline-none w-1/2"
                required
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex flex-1 flex-col">
            <div className="max-w-[360px] w-full bg-white p-5 py-10 max-md:mt-16">
              <CartTotal method={method} setMethod={setMethod} />
              {!isOrderPage ? (
                <button
                  onClick={() => navigate("/place-order")}
                  className="btn-dark w-full mt-8"
                >
                  Proceed to Delivery
                </button>
              ) : (
                <button type="submit" className="btn-dark w-full mt-8">
                  Proceed to Order
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PlaceOrder;
