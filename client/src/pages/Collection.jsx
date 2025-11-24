import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Item from "../components/Item";
import Title from "../components/Title";

const Collection = () => {
  const { products, searchQuery } = useContext(ShopContext);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1)
   const itemsPerPage = 10;

  useEffect(() => {
    if (searchQuery.length > 0) {
      setFilteredProducts(
        products.filter((product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredProducts(products);
    }
     setCurrentPage(1); // 🔁 Reset to first page on search/filter change
  }, [products, searchQuery]);

const totalPages = Math.ceil(filteredProducts.filter(p => p.inStock).length / itemsPerPage);

useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, [currentPage]);


  // Calculate product range display
  const inStockProducts = filteredProducts.filter(p => p.inStock);
  const startProduct = (currentPage - 1) * itemsPerPage + 1;
  const endProduct = Math.min(currentPage * itemsPerPage, inStockProducts.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-16 pt-28">
      <div className="max-padd-container">
        {/* Glass Container */}
        <div className="bg-white/50 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8 md:p-12">
          {/* Elegant Title */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Tất cả <span className="text-gray-400 font-light">sản phẩm</span>
            </h1>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.length > 0 ? (
              filteredProducts
                .filter((product) => product.inStock)
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((product) => <Item key={product._id} product={product} />)
            ) : (
              <p className="text-gray-500 col-span-full text-center py-10">
                Không tìm thấy sản phẩm phù hợp.
              </p>
            )}
          </div>

          {/* Pagination */}
          {inStockProducts.length > 0 && (
            <div className="mt-16 mb-6">
              <div className="flex flex-col items-center gap-6">
                {/* Pagination Buttons */}
                <div className="flex items-center gap-3">
                  {/* Previous Button */}
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className={`w-11 h-11 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                      currentPage === 1
                        ? "border-gray-200 text-gray-300 cursor-not-allowed"
                        : "border-gray-300 text-gray-700 hover:border-gray-900 hover:bg-gray-900 hover:text-white hover:shadow-lg"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, index) => (
                      <button
                        key={index + 1}
                        onClick={() => setCurrentPage(index + 1)}
                        className={`w-11 h-11 rounded-full border-2 transition-all duration-300 font-medium ${
                          currentPage === index + 1
                            ? "border-gray-900 bg-gray-900 text-white shadow-lg"
                            : "border-gray-300 text-gray-700 hover:border-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className={`w-11 h-11 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                      currentPage === totalPages
                        ? "border-gray-200 text-gray-300 cursor-not-allowed"
                        : "border-gray-300 text-gray-700 hover:border-gray-900 hover:bg-gray-900 hover:text-white hover:shadow-lg"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Product Count Display */}
                <p className="text-sm text-gray-500">
                  Hiển thị {startProduct}-{endProduct} trong tổng số {inStockProducts.length} sản phẩm
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Collection;
