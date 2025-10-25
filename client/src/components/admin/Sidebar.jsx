import React, { useContext } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { FaSquarePlus } from "react-icons/fa6";
import { FaListAlt } from "react-icons/fa";
import { MdFactCheck } from "react-icons/md";
import { BiLogOut } from "react-icons/bi";
import { ShopContext } from "../../context/ShopContext";
import toast from "react-hot-toast";

const Sidebar = () => {
  const { navigate, axios } = useContext(ShopContext);

  const logout = async () => {
   try {
    const {data} = await axios.post('/api/admin/logout')
    if(data.success){
      console.log(data)
      toast.success(data.message)
      navigate('/');
    }else{
      toast.error(data.message)
    }
   } catch (error) {
    toast.error(data.message)
   }
  };

  const navItems = [
    {
      path: "/admin",
      label: "Add Item",
      icon: <FaSquarePlus/>,
    },
    {
      path: "/admin/list",
      label: "List",
      icon: <FaListAlt/>,
    },
    {
      path: "/admin/orders",
      label: "Orders",
      icon: <MdFactCheck/>,
    },
  ];

  return (
      <div className="mx-auto max-w-[1440px] flex flex-col sm:flex-row ">

        {/* SIDEBAR */}
        <div className="max-sm:flexCenter max-xs:pb-3 bg-primary pb-3 m-2 sm:min-w-[20%] sm:min-h-[97vh] rounded-xl">
          <div className="flex flex-col gap-y-6 max-sm:items-center sm:flex-col pt-4 sm:pt-14">
            {/* logo */}
            <Link
              to="/admin"
              className="bold-20 md:bold-24 uppercase font-paci lg:pl-[15%]"
            >
              Shopprr <span className="text-secondary bold-28">.</span>
            </Link>

            <div className="flex sm:flex-col sm:gap-x-5 gap-y-8 sm:pt-10">
              {navItems.map((item) => (
                <NavLink
                  to={item.path}
                  key={item.label}
                  end={item.path === "/admin"}
                  className={({ isActive }) =>
                    isActive
                      ? "flexStart gap-x-2 p-5 lg:pl-12 medium-15 cursor-pointer h-10 text-secondary bg-tertiary/10 max-sm:border-b-4 sm:border-r-4 border-secondary"
                      : "flexStart gap-x-2 lg:pl-12 p-5 medium-15 cursor-pointer h-10 rounded-xl"
                  }
                >
                  {item.icon}
                  <div className="hidden sm:flex">{item.label}</div>
                </NavLink>
              ))}

              <div className="max-sm:ml-5 sm:mt-48">
                <button
                  onClick={logout}
                  className="flexStart gap-x-2 lg:pl-12 p-5 medium-15 cursor-pointer h-10 rounded-xl text-red-500"
                >
                  <BiLogOut className="text-lg" />
                  <div className="hidden sm:flex">Logout</div>
                </button>
              </div>
            </div>
          </div>
        </div>
        <Outlet />
      </div>
  );
};

export default Sidebar;
