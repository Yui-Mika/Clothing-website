import React, { useContext, useEffect, useState } from "react" // import hooks cần thiết
import { toast } from "react-hot-toast" // import toast để hiển thị thông báo
import { ShopContext } from "../../context/ShopContext" // import ShopContext để sử dụng axios và currency
import { FiEdit2, FiTrash2, FiPlus, FiX, FiSearch } from "react-icons/fi" // import icons

// Component hiển thị danh sách đơn hàng (Admin)
const Orders = () => {
  const { currency, axios, products } = useContext(ShopContext) // lấy currency, axios và products từ context
  const [orders, setOrders] = useState([]) // state chứa mảng đơn hàng
  const [loading, setLoading] = useState(true) // state để hiển thị trạng thái đang tải
  const [error, setError] = useState(null) // state lưu lỗi nếu có
  const [customers, setCustomers] = useState([]) // state chứa danh sách khách hàng
  
  // States cho Create Order Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    customerId: "",
    items: [],
    address: {
      firstName: "",
      lastName: "",
      email: "",
      street: "",
      city: "",
      state: "",
      zipcode: "",
      country: "",
      phone: ""
    },
    paymentMethod: "COD"
  })
  const [selectedProduct, setSelectedProduct] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  
  // States cho Edit Order Modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [editForm, setEditForm] = useState({
    address: {
      firstName: "",
      lastName: "",
      email: "",
      street: "",
      city: "",
      state: "",
      zipcode: "",
      country: "",
      phone: ""
    },
    status: ""
  })

  // Hàm fetchAllOrders: lấy danh sách đơn hàng từ server
  const fetchAllOrders = async () => {
    try {
      setLoading(true) // bắt đầu loading
      setError(null) // reset error
      console.log("🔄 Fetching orders...")
      const { data } = await axios.post("/api/order/list") // gọi API /api/order/list
      console.log("📦 Response:", data)
      if (data.success) {
        setOrders(data.orders) // lưu orders vào state
        console.log("✅ Loaded orders:", data.orders.length) // log số lượng orders
      } else {
        const errorMsg = data.message || "Unknown error"
        setError(errorMsg)
        toast.error(errorMsg) // hiển thị lỗi nếu server trả về success: false
        console.error("❌ API error:", errorMsg)
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Network error"
      setError(errorMsg)
      console.log("❌ Fetch error:", error)
      toast.error(errorMsg) // hiển thị lỗi nếu request lỗi
    } finally {
      setLoading(false) // kết thúc loading
      console.log("✔️ Fetch completed")
    }
  }

  // Hàm fetchCustomers: lấy danh sách khách hàng
  const fetchCustomers = async () => {
    try {
      const { data } = await axios.get("/api/user/list-all")
      if (data.success) {
        setCustomers(data.users)
      }
    } catch (error) {
      console.log("Error fetching customers:", error)
    }
  }

  // Hàm statusHandler: thay đổi trạng thái đơn hàng (packing, shipped, delivered...)
  const statusHandler = async (e, orderId) => {
    try {
      const { data } = await axios.post("/api/order/status", {
        orderId,
        status: e.target.value, // lấy value từ select
      })
      if (data.success) {
        await fetchAllOrders() // reload danh sách đơn hàng sau khi cập nhật
        toast.success(data.message) // thông báo thành công
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message) // thông báo lỗi
    }
  }

  // Hàm deleteOrder: xóa đơn hàng
  const deleteOrder = async (orderId) => {
    // Xác nhận trước khi xóa
    if (!window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này?")) {
      return
    }
    
    try {
      const {data} = await axios.post('/api/order/delete', {orderId})
      if(data.success){
        await fetchAllOrders() // reload danh sách sau khi xóa
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Hàm editOrder: mở modal chỉnh sửa đơn hàng
  const editOrder = (orderId) => {
    const order = orders.find(o => o._id === orderId)
    if (order) {
      setEditingOrder(order)
      setEditForm({
        address: { ...order.address },
        status: order.status
      })
      setShowEditModal(true)
    }
  }

  // Hàm handleUpdateOrder: cập nhật đơn hàng
  const handleUpdateOrder = async (e) => {
    e.preventDefault()
    
    try {
      const { data } = await axios.post('/api/order/update', {
        orderId: editingOrder._id,
        address: editForm.address,
        status: editForm.status
      })
      
      if (data.success) {
        await fetchAllOrders()
        setShowEditModal(false)
        setEditingOrder(null)
        toast.success(data.message || "Cập nhật đơn hàng thành công!")
      } else {
        toast.error(data.message || "Lỗi khi cập nhật đơn hàng")
      }
    } catch (error) {
      console.error("Update order error:", error)
      toast.error(error.message || "Lỗi khi cập nhật đơn hàng")
    }
  }

  // Hàm handleCreateOrder: tạo đơn hàng mới
  const handleCreateOrder = async (e) => {
    e.preventDefault()
    
    // Validation
    if (createForm.items.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm")
      return
    }
    if (!createForm.address.firstName || !createForm.address.lastName) {
      toast.error("Vui lòng nhập tên khách hàng")
      return
    }
    if (!createForm.address.phone) {
      toast.error("Vui lòng nhập số điện thoại")
      return
    }
    if (!createForm.address.street || !createForm.address.city) {
      toast.error("Vui lòng nhập địa chỉ đầy đủ")
      return
    }

    try {
      const { data } = await axios.post('/api/order/create-admin', {
        items: createForm.items,
        address: createForm.address,
        paymentMethod: createForm.paymentMethod
      })
      
      if (data.success) {
        await fetchAllOrders()
        setShowCreateModal(false)
        // Reset form
        setCreateForm({
          customerId: "",
          items: [],
          address: {
            firstName: "",
            lastName: "",
            email: "",
            street: "",
            city: "",
            state: "",
            zipcode: "",
            country: "",
            phone: ""
          },
          paymentMethod: "COD"
        })
        toast.success(data.message || "Tạo đơn hàng thành công!")
      } else {
        toast.error(data.message || "Lỗi khi tạo đơn hàng")
      }
    } catch (error) {
      console.error("Create order error:", error)
      toast.error(error.message || "Lỗi khi tạo đơn hàng")
    }
  }

  // Hàm addProductToOrder: thêm sản phẩm vào đơn hàng
  const addProductToOrder = () => {
    if (!selectedProduct) {
      toast.error("Vui lòng chọn sản phẩm")
      return
    }
    if (!selectedSize) {
      toast.error("Vui lòng chọn size")
      return
    }
    
    const product = products.find(p => p._id === selectedProduct)
    if (product) {
      setCreateForm(prev => ({
        ...prev,
        items: [...prev.items, {
          product: selectedProduct,
          productName: product.name,
          productImage: product.image[0],
          productPrice: product.offerPrice,
          size: selectedSize,
          quantity: selectedQuantity
        }]
      }))
      // Reset
      setSelectedProduct("")
      setSelectedSize("")
      setSelectedQuantity(1)
      toast.success("Đã thêm sản phẩm vào đơn hàng")
    }
  }

  // Hàm removeProductFromOrder: xóa sản phẩm khỏi đơn hàng
  const removeProductFromOrder = (index) => {
    setCreateForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  // Hàm handleCustomerSelect: chọn khách hàng
  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c._id === customerId)
    if (customer) {
      setCreateForm(prev => ({
        ...prev,
        customerId: customerId,
        address: {
          firstName: customer.name.split(' ')[0] || "",
          lastName: customer.name.split(' ').slice(1).join(' ') || "",
          email: customer.email || "",
          street: customer.address || "",
          city: "",
          state: "",
          zipcode: "",
          country: "",
          phone: customer.phone || ""
        }
      }))
    }
  }

  useEffect(() => {
    fetchAllOrders() // gọi khi component mount để load đơn hàng
    fetchCustomers() // lấy danh sách khách hàng
  }, [])

  // Hiển thị loading spinner khi đang tải
  if (loading) {
    return (
      <div className="px-2 sm:px-6 py-12 m-2 h-[97vh] bg-primary overflow-y-scroll lg:w-4/5 rounded-xl">
        {/* Header với nút Create Order */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Quản Lý Đơn Hàng</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors"
          >
            <FiPlus size={18} />
            <span>Tạo Đơn Hàng</span>
          </button>
        </div>

        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-3 text-gray-600">Đang tải đơn hàng...</p>
          </div>
        </div>
      </div>
    )
  }

  // Hiển thị thông báo khi chưa có đơn hàng
  if (!loading && orders.length === 0) {
    return (
      <div className="px-2 sm:px-6 py-12 m-2 h-[97vh] bg-primary overflow-y-scroll lg:w-4/5 rounded-xl">
        {/* Header với nút Create Order */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Quản Lý Đơn Hàng</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors"
          >
            <FiPlus size={18} />
            <span>Tạo Đơn Hàng</span>
          </button>
        </div>

        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center bg-white p-8 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có đơn hàng nào</h3>
            <p className="text-gray-500">Các đơn hàng sẽ hiển thị ở đây khi khách hàng đặt mua.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-2 sm:px-6 py-12 m-2 h-[97vh] bg-primary overflow-y-scroll lg:w-4/5 rounded-xl">
      {/* Header với nút Create Order */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Quản Lý Đơn Hàng</h2>
        <button
          onClick={() => {
            console.log("Clicked Create Order button")
            console.log("showCreateModal before:", showCreateModal)
            setShowCreateModal(true)
            console.log("showCreateModal after:", true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors"
        >
          <FiPlus size={18} />
          <span>Tạo Đơn Hàng</span>
        </button>
      </div>

      {/* Lặp qua từng đơn hàng và hiển thị */}
      {orders.map((order) => (
        <div key={order._id} className="bg-white p-3 mb-4 rounded">
          {/* Products List: các sản phẩm trong đơn hàng */}
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="text-gray-700 flex flex-col lg:flex-row gap-4 mb-3"
            >
              <div className="flex flex-[2] gap-x-3">
                <div className="flex items-center justify-center bg-primary rounded">
                  {/* Ảnh sản phẩm trong đơn */}
                  <img
                    src={item.product?.image?.[0] || '/placeholder.png'}
                    alt=""
                    className="max-h-20 max-w-20 object-contain"
                  />
                </div>

                <div className="block w-full">
                  {/* Tên sản phẩm */}
                  <h5 className="h5 capitalize line-clamp-1">
                    {item.product?.name || 'Product name unavailable'}
                  </h5>
                  {/* Thông tin phụ: giá, số lượng, size */}
                  <div className="flex flex-wrap gap-3 max-sm:gap-y-1 mt-1">
                    <div className="flex items-center gap-x-2">
                      <h5 className="medium-14">Price:</h5>
                      <p>
                        {currency}
                        {item.product?.offerPrice || 0}
                      </p>
                    </div>
                    <div className="flex items-center gap-x-2">
                      <h5 className="medium-14">Quantity:</h5>
                      <p>{item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-x-2">
                      <h5 className="medium-14">Size:</h5>
                      <p>{item.size}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Order Summary: thông tin đơn hàng (id, khách, địa chỉ, trạng thái, ngày, tổng) */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4 border-t border-gray-300 pt-3">
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-x-2">
                <h5 className="medium-14">OrderId:</h5>
                <p className="text-xs break-all">{order._id}</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-x-2">
                  <h5 className="medium-14">Customer:</h5>
                  <p className="text-sm">
                    {order.address.firstName} {order.address.lastName}
                  </p>
                </div>
                <div className="flex items-center gap-x-2">
                  <h5 className="medium-14">Phone:</h5>
                  <p className="text-sm">{order.address.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-x-2">
                <h5 className="medium-14">Address:</h5>
                <p className="text-sm">
                  {order.address.street}, {order.address.city},{" "}
                  {order.address.state}, {order.address.country},{" "}
                  {order.address.zipcode}
                </p>
              </div>
             <div className="flex gap-4">
                <div className="flex items-center gap-x-2">
                  <h5 className="medium-14">Payment Status:</h5>
                  <p className="text-sm">
                    {order.isPaid ? "Done" : "Pending"}
                  </p>
                <div className="flex items-center gap-x-2">
                  <h5 className="medium-14">Method:</h5>
                  <p className="text-sm">{order.paymentMethod}</p>
                </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-x-2">
                  <h5 className="medium-14">Date:</h5>
                  <p className="text-sm">
                    {new Date(order.createdAt).toDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-x-2">
                  <h5 className="medium-14">Amount:</h5>
                  <p className="text-sm">
                     {currency}{order.amount}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side: Status selector và Action buttons */}
            <div className="flex flex-col gap-3 items-end">
              {/* Select để thay đổi trạng thái đơn hàng */}
              <div className="flex items-center gap-2">
                <h5 className="medium-14">Status:</h5>
                <select
                  onChange={(e) => statusHandler(e, order._id)}
                  value={order.status}
                  className="text-xs font-semibold p-1 ring-1 ring-slate-900/5 rounded max-w-36 bg-primary"
                >
                  <option value="Order Placed">Order Placed</option>
                  <option value="Packing">Packing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              {/* Action buttons: Edit và Delete */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => editOrder(order._id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs font-medium"
                  title="Sửa đơn hàng"
                >
                  <FiEdit2 size={14} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => deleteOrder(order._id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-xs font-medium"
                  title="Xóa đơn hàng"
                >
                  <FiTrash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">Tạo Đơn Hàng Mới</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateOrder} className="p-6 space-y-6">
              {/* Select Customer */}
              <div>
                <label className="block font-semibold mb-2">Chọn Khách Hàng (Tùy chọn)</label>
                <select
                  value={createForm.customerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="">-- Nhập thông tin thủ công --</option>
                  {customers.map(customer => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} - {customer.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Information */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Thông Tin Khách Hàng</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Họ *</label>
                    <input
                      type="text"
                      value={createForm.address.firstName}
                      onChange={(e) => setCreateForm({...createForm, address: {...createForm.address, firstName: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Tên *</label>
                    <input
                      type="text"
                      value={createForm.address.lastName}
                      onChange={(e) => setCreateForm({...createForm, address: {...createForm.address, lastName: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Email</label>
                    <input
                      type="email"
                      value={createForm.address.email}
                      onChange={(e) => setCreateForm({...createForm, address: {...createForm.address, email: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Số Điện Thoại *</label>
                    <input
                      type="tel"
                      value={createForm.address.phone}
                      onChange={(e) => setCreateForm({...createForm, address: {...createForm.address, phone: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm mb-1">Địa Chỉ *</label>
                    <input
                      type="text"
                      value={createForm.address.street}
                      onChange={(e) => setCreateForm({...createForm, address: {...createForm.address, street: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Thành Phố *</label>
                    <input
                      type="text"
                      value={createForm.address.city}
                      onChange={(e) => setCreateForm({...createForm, address: {...createForm.address, city: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Quốc Gia</label>
                    <input
                      type="text"
                      value={createForm.address.country}
                      onChange={(e) => setCreateForm({...createForm, address: {...createForm.address, country: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                </div>
              </div>

              {/* Add Products */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Thêm Sản Phẩm</h4>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {products.filter(p => p.inStock).map(product => (
                      <option key={product._id} value={product._id}>
                        {product.name} - {currency}{product.offerPrice}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <option value="">Size</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    placeholder="SL"
                  />
                </div>
                <button
                  type="button"
                  onClick={addProductToOrder}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                >
                  Thêm Sản Phẩm
                </button>

                {/* Products List */}
                {createForm.items.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h5 className="font-medium">Sản phẩm đã thêm:</h5>
                    {createForm.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <img src={item.productImage} alt="" className="w-12 h-12 object-cover rounded" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.productName}</p>
                          <p className="text-xs text-gray-600">
                            Size: {item.size} | SL: {item.quantity} | Giá: {currency}{item.productPrice}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProductFromOrder(index)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="border-t pt-4">
                <label className="block font-semibold mb-2">Phương Thức Thanh Toán</label>
                <select
                  value={createForm.paymentMethod}
                  onChange={(e) => setCreateForm({...createForm, paymentMethod: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="COD">COD (Thanh toán khi nhận hàng)</option>
                  <option value="Stripe">Stripe (Đã thanh toán)</option>
                </select>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors"
                >
                  Tạo Đơn Hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && editingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">Chỉnh Sửa Đơn Hàng</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdateOrder} className="p-6 space-y-4">
              {/* Order ID */}
              <div>
                <label className="block font-semibold mb-1">Mã Đơn Hàng</label>
                <input
                  type="text"
                  value={editingOrder._id}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Customer Address */}
              <div>
                <h4 className="font-semibold mb-3">Thông Tin Khách Hàng</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Họ</label>
                    <input
                      type="text"
                      value={editForm.address.firstName}
                      onChange={(e) => setEditForm({...editForm, address: {...editForm.address, firstName: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Tên</label>
                    <input
                      type="text"
                      value={editForm.address.lastName}
                      onChange={(e) => setEditForm({...editForm, address: {...editForm.address, lastName: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Email</label>
                    <input
                      type="email"
                      value={editForm.address.email}
                      onChange={(e) => setEditForm({...editForm, address: {...editForm.address, email: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Số Điện Thoại</label>
                    <input
                      type="tel"
                      value={editForm.address.phone}
                      onChange={(e) => setEditForm({...editForm, address: {...editForm.address, phone: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm mb-1">Địa Chỉ</label>
                    <input
                      type="text"
                      value={editForm.address.street}
                      onChange={(e) => setEditForm({...editForm, address: {...editForm.address, street: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Thành Phố</label>
                    <input
                      type="text"
                      value={editForm.address.city}
                      onChange={(e) => setEditForm({...editForm, address: {...editForm.address, city: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Quốc Gia</label>
                    <input
                      type="text"
                      value={editForm.address.country}
                      onChange={(e) => setEditForm({...editForm, address: {...editForm.address, country: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                </div>
              </div>

              {/* Order Status */}
              <div>
                <label className="block font-semibold mb-1">Trạng Thái Đơn Hàng</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="Order Placed">Order Placed</option>
                  <option value="Packing">Packing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Done">Done</option>
                </select>
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
  )
}

export default Orders
