import React from "react";
import { LiaShippingFastSolid } from "react-icons/lia"; // import các icons từ React
import { MdCurrencyExchange } from "react-icons/md";
import { BiSupport } from "react-icons/bi";
import { TbPackageImport } from "react-icons/tb";


const Features = () => {
  return (
    // Dùng Flexbox và Grid để tạo bố cục cho các tính năng
    <section className="max-padd-container mt-10">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
        {/* Tính năng 1 */}
        <div className="flexCenter gap-x-4">
          <LiaShippingFastSolid className="text-4xl"/>
          <div>
            <h5 className="medium-15">Free Shipping</h5>
            <p>On above $100 order</p>  
          </div>
        </div>

        {/* Tính năng 2 */}
        <div className="flexCenter gap-x-4">
          <MdCurrencyExchange className="text-4xl"/>
          <div>
            <h5 className="medium-15">Member Discount</h5>
            <p>Discount for elite Members</p>
          </div>
        </div>

        {/* Tính năng 3 */}
        <div className="flexCenter gap-x-4">
          <BiSupport className="text-4xl"/>
          <div>
            <h5 className="medium-15">Fast Support</h5>
            <p>24/7 Customer support</p>
          </div>
        </div>

        {/* Tính năng 4 */}
        <div className="flexCenter gap-x-4">
          <TbPackageImport className="text-4xl"/>
          <div>
            <h5 className="medium-15">Easy Returns</h5>
            <p>14 Days easy returns</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
