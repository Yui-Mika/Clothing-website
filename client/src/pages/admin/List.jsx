import axios from "axios"; // (đã import ở đây, sẽ dùng trực tiếp)
import React, { useContext, useState, useEffect } from "react" // import React và hooks
import { toast } from "react-hot-toast" // import toast để hiển thị thông báo
import { ShopContext } from "../../context/ShopContext" // import ShopContext để truy cập currency, axios
import { FiEdit2, FiTrash2, FiX, FiSearch, FiFilter, FiCheck } from "react-icons/fi" // import icons

// Component hiển thị danh sách sản phẩm (Admin view)
const List = () => {
  // lấy currency và axios từ context (không dùng products từ context nữa)
  const { currency, axios } = useContext(ShopContext);
  
  // State cho products (fetch trực tiếp trong component này)
  const [products, setProducts] = useState([])
  
  // States cho Search & Filter
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Tất cả")
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showHiddenProducts, setShowHiddenProducts] = useState(false)
  
  // States cho Discount
  const [discountPercent, setDiscountPercent] = useState("")
  const [selectedProducts, setSelectedProducts] = useState([]) // Mảng chứa ID sản phẩm được chọn
  const [startDate, setStartDate] = useState("") // Ngày bắt đầu offer price
  const [endDate, setEndDate] = useState("") // Ngày kết thúc offer price
  
  // States cho Edit Modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    offerPrice: "",
    category: "",
    sizes: [],
    isActive: true
  })

  // Hàm fetch ALL products cho admin (không filter isActive)
  const fetchProducts = async () => {
    try {
      const { data } = await axios.get("/api/product/list")
      if (data.success) {
        // Admin nhận tất cả sản phẩm, không filter
        setProducts(data.products)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // useEffect để fetch products khi component mount
  useEffect(() => {
    fetchProducts()
  }, [])

  // Danh sách categories
  const categories = [
    "Tất cả",
    "Áo Sơ Mi & Polo",
    "Quần",
    "Áo Khoác",
    "Đồ Lót & Đồ Mặc Trong",
    "Giày Dép",
    "Phụ Kiện"
  ]

  // Lọc sản phẩm theo search query, category và trạng thái hiển thị
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "Tất cả" || product.category === selectedCategory
    // Nếu không tích "Hiển thị đã ẩn" thì chỉ show active products
    const matchesActiveStatus = showHiddenProducts || product.isActive !== false
    return matchesSearch && matchesCategory && matchesActiveStatus
  })

  // Hàm toggleDiscount: bật/tắt discount cho sản phẩm
  const toggleDiscount = async (productId, hasDiscount) => {
    try {
      const {data} = await axios.post('/api/product/toggle-discount', {productId, hasDiscount})
      if(data.success){
        fetchProducts()
        toast.success(data.message)
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Hàm toggle select sản phẩm
  const toggleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  // Hàm select tất cả sản phẩm
  const selectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p._id))
    }
  }

  // Hàm apply discount cho các sản phẩm đã chọn
  const applyDiscount = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm")
      return
    }
    if (!discountPercent || discountPercent <= 0 || discountPercent > 100) {
      toast.error("Vui lòng nhập % giảm giá hợp lệ (1-100)")
      return
    }
    if (!startDate || !endDate) {
      toast.error("Vui lòng chọn ngày bắt đầu và kết thúc")
      return
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Ngày bắt đầu phải trước ngày kết thúc")
      return
    }

    try {
      const {data} = await axios.post('/api/product/apply-discount', {
        productIds: selectedProducts,
        discountPercent: Number(discountPercent),
        startDate,
        endDate
      })
      
      if(data.success){
        fetchProducts()
        setSelectedProducts([])
        setDiscountPercent("")
        setStartDate("")
        setEndDate("")
        toast.success(data.message || "Áp dụng giảm giá thành công!")
      } else {
        toast.error(data.message || "Lỗi khi áp dụng giảm giá")
      }
    } catch (error) {
      console.error("Apply discount error:", error)
      toast.error(error.response?.data?.message || error.message || "Lỗi khi áp dụng giảm giá")
    }
  }

  // Hàm apply discount cho toàn bộ category
  const applyDiscountToCategory = async () => {
    if (selectedCategory === "Tất cả") {
      toast.error("Vui lòng chọn một danh mục cụ thể")
      return
    }
    if (!discountPercent || discountPercent <= 0 || discountPercent > 100) {
      toast.error("Vui lòng nhập % giảm giá hợp lệ (1-100)")
      return
    }
    if (!startDate || !endDate) {
      toast.error("Vui lòng chọn ngày bắt đầu và kết thúc")
      return
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Ngày bắt đầu phải trước ngày kết thúc")
      return
    }

    // Đếm số sản phẩm trong category
    const categoryProducts = filteredProducts.filter(p => p.category === selectedCategory)
    
    if (!window.confirm(`Bạn có chắc chắn muốn áp dụng giảm giá ${discountPercent}% cho toàn bộ ${categoryProducts.length} sản phẩm trong danh mục "${selectedCategory}"?`)) {
      return
    }

    try {
      const {data} = await axios.post('/api/product/apply-discount', {
        category: selectedCategory,
        applyToAll: true,
        discountPercent: Number(discountPercent),
        startDate,
        endDate
      })
      
      if(data.success){
        fetchProducts()
        setDiscountPercent("")
        setStartDate("")
        setEndDate("")
        toast.success(data.message || `Áp dụng giảm giá cho ${data.updatedCount} sản phẩm thành công!`)
      } else {
        toast.error(data.message || "Lỗi khi áp dụng giảm giá")
      }
    } catch (error) {
      console.error("Apply discount to category error:", error)
      toast.error(error.response?.data?.message || error.message || "Lỗi khi áp dụng giảm giá")
    }
  }

  // Hàm remove discount cho các sản phẩm đã chọn
  const removeDiscount = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm")
      return
    }

    if (!window.confirm(`Bạn có chắc chắn muốn hủy giảm giá cho ${selectedProducts.length} sản phẩm?`)) {
      return
    }

    try {
      const {data} = await axios.post('/api/product/remove-discount', {
        productIds: selectedProducts
      })
      
      if(data.success){
        fetchProducts()
        setSelectedProducts([])
        toast.success(data.message || "Hủy giảm giá thành công!")
      } else {
        toast.error(data.message || "Lỗi khi hủy giảm giá")
      }
    } catch (error) {
      console.error("Remove discount error:", error)
      toast.error(error.response?.data?.message || error.message || "Lỗi khi hủy giảm giá")
    }
  }

  // Hàm remove discount cho toàn bộ category
  const removeDiscountFromCategory = async () => {
    if (selectedCategory === "Tất cả") {
      toast.error("Vui lòng chọn một danh mục cụ thể")
      return
    }

    // Đếm số sản phẩm có discount trong category
    const categoryProductsWithDiscount = filteredProducts.filter(p => p.category === selectedCategory && p.hasDiscount)
    
    if (categoryProductsWithDiscount.length === 0) {
      toast.error(`Không có sản phẩm nào trong danh mục "${selectedCategory}" đang có giảm giá`)
      return
    }

    if (!window.confirm(`Bạn có chắc chắn muốn hủy giảm giá cho ${categoryProductsWithDiscount.length} sản phẩm trong danh mục "${selectedCategory}"?`)) {
      return
    }

    try {
      const {data} = await axios.post('/api/product/remove-discount', {
        category: selectedCategory,
        removeAll: true
      })
      
      if(data.success){
        fetchProducts()
        toast.success(data.message || `Hủy giảm giá cho ${data.updatedCount} sản phẩm thành công!`)
      } else {
        toast.error(data.message || "Lỗi khi hủy giảm giá")
      }
    } catch (error) {
      console.error("Remove discount from category error:", error)
      toast.error(error.response?.data?.message || error.message || "Lỗi khi hủy giảm giá")
    }
  }

  // Hàm toggleStock: thay đổi trạng thái inStock của sản phẩm
  const toggleStock = async (productId, inStock)=>{
    try {
      // gọi API server để cập nhật trạng thái inStock
      const {data} = await axios.post('/api/product/stock', {productId, inStock})
      if(data.success){
        fetchProducts() // nếu thành công, fetch lại products để cập nhật UI
        toast.success(data.message) // hiển thị thông báo thành công
      }else{
        toast.error(data.message) // hiển thị lỗi trả về từ server
      }
    } catch (error) {
      toast.error(error.message) // hiển thị lỗi nếu request thất bại
    }
  }

  // Hàm toggleActive: thay đổi trạng thái hiển thị/ẩn sản phẩm
  const toggleActive = async (productId, isActive) => {
    try {
      const {data} = await axios.patch(`/api/product/${productId}/toggle-active`)
      if(data.success){
        fetchProducts() // reload danh sách sau khi thay đổi
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error("Toggle active error:", error)
      toast.error(error.response?.data?.message || error.message || "Lỗi khi thay đổi trạng thái")
    }
  }

  // Hàm deleteProduct: xóa sản phẩm khỏi database
  const deleteProduct = async (productId) => {
    // Xác nhận trước khi xóa
    const product = products.find(p => p._id === productId)
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product?.name}"?`)) {
      return
    }
    
    try {
      const {data} = await axios.delete(`/api/product/${productId}`)
      if(data.success){
        fetchProducts() // reload danh sách sau khi xóa
        toast.success(data.message || "Xóa sản phẩm thành công!")
      } else {
        toast.error(data.message || "Lỗi khi xóa sản phẩm")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error(error.message || "Lỗi khi xóa sản phẩm")
    }
  }

  // Hàm editProduct: mở modal chỉnh sửa
  const editProduct = (productId) => {
    const product = products.find(p => p._id === productId)
    if (product) {
      setEditingProduct(product)
      setEditForm({
        name: product.name,
        description: product.description,
        price: product.price,
        offerPrice: product.offerPrice,
        category: product.category,
        sizes: product.sizes || [],
        isActive: product.isActive !== undefined ? product.isActive : true
      })
      setShowEditModal(true)
    }
  }

  // Hàm handleUpdateProduct: cập nhật sản phẩm
  const handleUpdateProduct = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!editForm.name.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm")
      return
    }
    if (!editForm.description.trim()) {
      toast.error("Vui lòng nhập mô tả sản phẩm")
      return
    }
    if (editForm.sizes.length === 0) {
      toast.error("Vui lòng chọn ít nhất một size")
      return
    }

    try {
      const {data} = await axios.post('/api/product/update', {
        productId: editingProduct._id,
        ...editForm
      })
      
      if(data.success){
        fetchProducts() // reload danh sách
        setShowEditModal(false)
        setEditingProduct(null)
        toast.success(data.message || "Cập nhật sản phẩm thành công!")
      } else {
        toast.error(data.message || "Lỗi khi cập nhật sản phẩm")
      }
    } catch (error) {
      console.error("Update error:", error)
      toast.error(error.message || "Lỗi khi cập nhật sản phẩm")
    }
  }

  // Hàm toggle size
  const toggleSize = (size) => {
    setEditForm(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }))
  }

  return (
    <div className="px-2 sm:px-6 py-12 m-2 h-[97vh] bg-gray-50 overflow-y-scroll lg:w-4/5 rounded-xl">
      {/* Search & Filter Bar */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        {/* Search Box */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm theo tên hoặc mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 outline-none transition-all duration-200"
          />
        </div>

        {/* Filter Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-all duration-200 font-medium min-w-[160px] justify-between"
          >
            <div className="flex items-center gap-2">
              <FiFilter size={18} />
              <span className="text-sm">{selectedCategory}</span>
            </div>
            <svg className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="py-1">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category)
                      setShowFilterDropdown(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      selectedCategory === category ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Toggle Hiển thị sản phẩm đã ẩn */}
        <label className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer">
          <input
            type="checkbox"
            checked={showHiddenProducts}
            onChange={(e) => setShowHiddenProducts(e.target.checked)}
            className="w-4 h-4 text-gray-900 border-2 border-gray-300 rounded focus:ring-2 focus:ring-gray-900/20 cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Sản phẩm đã ẩn</span>
        </label>
      </div>

      {/* Results Count */}
      <div className="mb-2 text-sm text-gray-600">
        Hiển thị <span className="font-semibold">{filteredProducts.length}</span> sản phẩm
        {searchQuery && ` cho "${searchQuery}"`}
        {selectedCategory !== "Tất cả" && ` trong danh mục "${selectedCategory}"`}
      </div>

      {/* Discount Control Bar */}
      <div className="mb-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-gray-700">% Giảm giá:</label>
            <input
              type="number"
              min="0"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              placeholder="0-100"
              className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 outline-none transition-all duration-200"
            />
          </div>
          
          <button
            onClick={selectAllProducts}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-900 hover:text-white text-gray-700 font-semibold rounded-lg transition-all duration-200"
          >
            {selectedProducts.length === filteredProducts.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
          </button>

          <div className="flex items-center gap-2">
            <label className="font-semibold text-gray-700">Từ:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 outline-none transition-all duration-200"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="font-semibold text-gray-700">Đến:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 outline-none transition-all duration-200"
            />
          </div>
          
          {selectedProducts.length > 0 && (
            <span className="text-sm text-gray-600 ml-auto">
              Đã chọn: <span className="font-semibold">{selectedProducts.length}</span> sản phẩm
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200">
          <button
            onClick={applyDiscount}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            <FiCheck size={18} />
            <span>Áp dụng cho sản phẩm đã chọn</span>
          </button>

          <button
            onClick={applyDiscountToCategory}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedCategory === "Tất cả"}
            title={selectedCategory === "Tất cả" ? "Vui lòng chọn một danh mục cụ thể" : ""}
          >
            <FiCheck size={18} />
            <span>Áp dụng cho "{selectedCategory}"</span>
          </button>

          <button
            onClick={removeDiscount}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            <FiX size={18} />
            <span>Hủy giảm giá</span>
          </button>

          <button
            onClick={removeDiscountFromCategory}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedCategory === "Tất cả"}
            title={selectedCategory === "Tất cả" ? "Vui lòng chọn một danh mục cụ thể" : ""}
          >
            <FiX size={18} />
            <span>Hủy giảm giá cho "{selectedCategory}"</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {/* Header bảng danh sách sản phẩm */}
        <div className="grid grid-cols-[0.5fr_1fr_3fr_1fr_1fr_1fr_1fr_1.2fr_1fr_1fr] items-center py-1 px-2 bg-white bold-14 sm:bold-15 mb-1 rounded">
          <h5></h5>
          <h5>Hình ảnh</h5>
          <h5>Tên sản phẩm</h5>
          <h5>Danh mục</h5>
          <h5>Giá gốc</h5>
          <h5>Giá KM</h5>
          <h5>Số lượng</h5>
          <h5>Giảm giá</h5>
          <h5>Trạng thái</h5>
          <h5>Thao tác</h5>
        </div>
        {/* Product List - lặp qua mảng products và render từng sản phẩm */}
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product, index) => (
          <div
            key={product._id}
            className="grid grid-cols-[0.5fr_1fr_3fr_1fr_1fr_1fr_1fr_1.2fr_1fr_1fr] items-center gap-2 p-2 bg-white rounded-lg"
          >
            {/* Checkbox để chọn sản phẩm */}
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={selectedProducts.includes(product._id)}
                onChange={() => toggleSelectProduct(product._id)}
                className="w-4 h-4 text-gray-900 border-2 border-gray-300 rounded focus:ring-2 focus:ring-gray-900/20 cursor-pointer"
              />
            </div>
            
            {/* Ảnh sản phẩm (lấy ảnh đầu tiên trong mảng image) */}
            <img
              src={product.image[0]}
              alt=""
              className="w-12 rounded bg-primary"
            />
            {/* Tên sản phẩm */}
            <div>
              <h5 className="text-sm font-semibold">{product.name}</h5>
              <div className="flex gap-2 mt-1">
                {product.hasDiscount && (
                  <span className="inline-block px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded">
                    GIẢM GIÁ
                  </span>
                )}
                {product.isActive === false && (
                  <span className="inline-block px-2 py-0.5 bg-gray-600 text-white text-xs font-semibold rounded">
                    ĐÃ ẨN
                  </span>
                )}
              </div>
            </div>
            {/* Danh mục */}
            <p className="text-sm font-semibold">{product.category}</p>
            {/* Giá gốc */}
            <div className="text-sm font-semibold">
              {currency}
              {product.price.toLocaleString()}
            </div>
            {/* Giá khuyến mãi */}
            <div className={`text-sm font-semibold ${product.hasDiscount ? 'text-red-600' : 'text-gray-700'}`}>
              {currency}
              {product.offerPrice.toLocaleString()}
            </div>
            {/* Số lượng tồn kho */}
            <div className={`text-sm font-semibold ${
              product.quantity === 0 
                ? 'text-red-600' 
                : product.quantity < 5 
                  ? 'text-orange-600' 
                  : 'text-gray-700'
            }`}>
              {product.quantity || 0}
              {product.quantity === 0 && (
                <span className="text-xs ml-1 block">(Hết hàng)</span>
              )}
            </div>
            {/* Thông tin discount */}
            <div className="text-xs">
              {product.hasDiscount ? (
                <div className="space-y-1">
                  <div className="font-semibold text-red-600">
                    -{product.discountPercent}%
                  </div>
                  {product.discountStartDate && product.discountEndDate && (
                    <div className="text-gray-500">
                      {new Date(product.discountStartDate).toLocaleDateString('vi-VN')} - {new Date(product.discountEndDate).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-gray-400">Chưa giảm giá</span>
              )}
            </div>
            {/* Trạng thái hiển thị/ẩn */}
            <div className="flex items-center justify-center">
              <button
                onClick={() => toggleActive(product._id, product.isActive)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  product.isActive !== false
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={product.isActive !== false ? 'Click để ẩn sản phẩm' : 'Click để hiển thị sản phẩm'}
              >
                <span className={`w-2 h-2 rounded-full ${
                  product.isActive !== false ? 'bg-green-500' : 'bg-gray-400'
                }`}></span>
                {product.isActive !== false ? 'Hiển thị' : 'Đã ẩn'}
              </button>
            </div>
            {/* Actions - nút Edit và Delete */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => editProduct(product._id)}
                className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                title="Chỉnh sửa"
              >
                <FiEdit2 className="text-blue-600 group-hover:text-blue-700" size={18} />
              </button>
              <button
                onClick={() => deleteProduct(product._id)}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                title="Xóa"
              >
                <FiTrash2 className="text-red-600 group-hover:text-red-700" size={18} />
              </button>
            </div>
          </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-lg text-center">
            <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">Chỉnh Sửa Sản Phẩm</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
              {/* Product Image Preview */}
              <div>
                <h5 className="font-semibold mb-2">Ảnh Hiện Tại</h5>
                <div className="flex gap-2 flex-wrap">
                  {editingProduct.image.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt=""
                      className="w-20 h-20 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block font-semibold mb-1">Tên Sản Phẩm *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="Nhập tên sản phẩm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold mb-1">Mô Tả *</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                  placeholder="Nhập mô tả sản phẩm"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-semibold mb-1">Danh Mục *</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="Áo Sơ Mi & Polo">Áo Sơ Mi & Polo</option>
                  <option value="Quần">Quần</option>
                  <option value="Áo Khoác">Áo Khoác</option>
                  <option value="Đồ Lót & Đồ Mặc Trong">Đồ Lót & Đồ Mặc Trong</option>
                  <option value="Giày Dép">Giày Dép</option>
                  <option value="Phụ Kiện">Phụ Kiện</option>
                </select>
              </div>

              {/* Price & Offer Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Giá Gốc *</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Giá Khuyến Mãi *</label>
                  <input
                    type="number"
                    value={editForm.offerPrice}
                    onChange={(e) => setEditForm({...editForm, offerPrice: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    min="0"
                  />
                </div>
              </div>

              {/* Sizes */}
              <div>
                <label className="block font-semibold mb-2">Sizes *</label>
                <div className="flex gap-2 flex-wrap">
                  {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        editForm.sizes.includes(size)
                          ? 'bg-secondary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hiển thị sản phẩm */}
              <div className="border-t pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                    className="w-5 h-5 text-green-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-gray-800">Hiển thị sản phẩm trên website</span>
                    <p className="text-xs text-gray-500 mt-0.5">Bỏ tích để ẩn sản phẩm khỏi người dùng</p>
                  </div>
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors"
                >
                  Cập Nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default List; // xuất component List
