import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import Item from "../components/Item";
import { useParams } from "react-router-dom";

const CategoryCollection = () => {
  const { products, searchQuery } = useContext(ShopContext);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const { category } = useParams();

  useEffect(() => {
    let result = products;

    // Filter by category from URL
    if (category) {
      result = result.filter(
        (product) => product.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (searchQuery.length > 0) {
      setFilteredProducts(
        (result = result.filter((product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
    }
    setFilteredProducts(result);
    setCurrentPage(1); // 🔁 Reset to first page on search/filter change
  }, [products, searchQuery, category]);

  const totalPages = Math.ceil(
    filteredProducts.filter((p) => p.inStock).length / itemsPerPage
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  return (
    <div className="max-padd-container py-16 pt-28">
      <Title
        title1={`${category}`}
        title2={"Products"}
        titleStyles={"pb-5 capitalize"}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filteredProducts.length > 0 ? (
          filteredProducts
            .filter((product) => product.inStock)
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((product) => <Item key={product._id} product={product} />)
        ) : (
          <p>Oops! Nothing matched your search.</p>
        )}
      </div>
      {/* PAGINATION */}
      <div className="flexCenter flex-wrap gap-4 mt-14 mb-10">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className={`${
            currentPage === 1 && "opacity-50 cursor-not-allowed"
          } btn-dark !py-1 !px-3`}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => setCurrentPage(index + 1)}
            className={`${
              currentPage === index + 1 && "!bg-tertiary text-white"
            } btn-light !py-1 !px-3`}
          >
            {index + 1}
          </button>
        ))}
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className={`${
            currentPage === totalPages && "opacity-50 cursor-not-allowed"
          } btn-dark !py-1 !px-3`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CategoryCollection;
