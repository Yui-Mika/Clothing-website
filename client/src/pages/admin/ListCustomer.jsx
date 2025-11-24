import React, { useContext, useEffect, useState } from "react" // import hooks cần thiết
import { toast } from "react-hot-toast" // import toast để hiển thị thông báo
import { ShopContext } from "../../context/ShopContext" // import ShopContext
import { FiEye, FiEyeOff, FiUserPlus, FiX, FiEdit2, FiTrash2 } from "react-icons/fi" // import icons cho show/hide password, thêm user, edit và delete

// Component hiển thị danh sách khách hàng (Admin)
const ListCustomer = () => {
  const { axios } = useContext(ShopContext) // lấy axios từ context
  const [customers, setCustomers] = useState([]) // state chứa mảng khách hàng
  const [loading, setLoading] = useState(true) // state loading
  const [showPasswords, setShowPasswords] = useState({}) // state để track password nào đang hiển thị
  const [showAddModal, setShowAddModal] = useState(false) // state để hiển thị/ẩn modal thêm khách hàng
  const [showEditModal, setShowEditModal] = useState(false) // state để hiển thị/ẩn modal sửa khách hàng
  const [editingCustomer, setEditingCustomer] = useState(null) // state lưu customer đang được sửa
  
  // State cho form thêm khách hàng
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    phone: "",
    address: ""
  })

  // Hàm fetchAllCustomers: lấy danh sách khách hàng từ server
  const fetchAllCustomers = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get("/api/user/list-all") // gọi API
      if (data.success) {
        setCustomers(data.users) // lưu customers vào state
        console.log("✅ Loaded customers:", data.users.length)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log("❌ Fetch error:", error)
      toast.error(error.message || "Lỗi khi tải danh sách khách hàng")
    } finally {
      setLoading(false)
    }
  }

  // Toggle hiển thị password cho một customer cụ thể
  const togglePasswordVisibility = (customerId) => {
    setShowPasswords(prev => ({
      ...prev,
      [customerId]: !prev[customerId]
    }))
  }

  // Hàm xử lý thay đổi input trong form
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Hàm thêm khách hàng mới
  const handleAddCustomer = async (e) => {
    e.preventDefault()
    
    // Validate dữ liệu
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Vui lòng điền đầy đủ họ tên, email và mật khẩu")
      return
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Email không hợp lệ")
      return
    }

    // Validate password length
    if (formData.password.length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự")
      return
    }

    try {
      const { data } = await axios.post("/api/user/register", formData)
      if (data.success) {
        toast.success("Thêm khách hàng thành công!")
        setShowAddModal(false) // đóng modal
        // Reset form
        setFormData({
          name: "",
          email: "",
          password: "",
          age: "",
          gender: "",
          phone: "",
          address: ""
        })
        fetchAllCustomers() // reload danh sách
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log("❌ Add customer error:", error)
      toast.error(error.response?.data?.message || error.message || "Lỗi khi thêm khách hàng")
    }
  }

  // Hàm mở modal sửa và load dữ liệu customer
  const handleEditClick = (customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      password: "", // không load password cũ
      age: customer.age || "",
      gender: customer.gender || "",
      phone: customer.phone || "",
      address: customer.address || ""
    })
    setShowEditModal(true)
  }

  // Hàm sửa thông tin khách hàng
  const handleUpdateCustomer = async (e) => {
    e.preventDefault()
    
    // Validate dữ liệu
    if (!formData.name || !formData.email) {
      toast.error("Vui lòng điền đầy đủ họ tên và email")
      return
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Email không hợp lệ")
      return
    }

    // Nếu có nhập password mới, validate độ dài
    if (formData.password && formData.password.length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự")
      return
    }

    try {
      // Tạo object chỉ chứa các field có giá trị
      const updateData = {
        customerId: editingCustomer._id,
        name: formData.name,
        email: formData.email,
        age: formData.age || undefined,
        gender: formData.gender || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined
      }
      
      // Chỉ thêm password nếu user nhập mới
      if (formData.password) {
        updateData.password = formData.password
      }

      const { data } = await axios.post("/api/user/update", updateData)
      if (data.success) {
        toast.success("Cập nhật khách hàng thành công!")
        setShowEditModal(false)
        setEditingCustomer(null)
        // Reset form
        setFormData({
          name: "",
          email: "",
          password: "",
          age: "",
          gender: "",
          phone: "",
          address: ""
        })
        fetchAllCustomers() // reload danh sách
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log("❌ Update customer error:", error)
      toast.error(error.response?.data?.message || error.message || "Lỗi khi cập nhật khách hàng")
    }
  }

  // Hàm xóa khách hàng
  const handleDeleteCustomer = async (customerId, customerName) => {
    // Xác nhận trước khi xóa
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${customerName}"?`)) {
      return
    }

    try {
      const { data } = await axios.post("/api/user/delete", { customerId })
      if (data.success) {
        toast.success("Xóa khách hàng thành công!")
        fetchAllCustomers() // reload danh sách
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log("❌ Delete customer error:", error)
      toast.error(error.response?.data?.message || error.message || "Lỗi khi xóa khách hàng")
    }
  }

  useEffect(() => {
    fetchAllCustomers() // gọi khi component mount
  }, [])

  // Hiển thị loading spinner
  if (loading) {
    return (
      <div className="px-2 sm:px-6 py-12 m-2 h-[97vh] bg-primary overflow-y-scroll lg:w-4/5 rounded-xl flex items-center justify-center custom-scrollbar">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-3 text-gray-600">Đang tải danh sách khách hàng...</p>
        </div>
      </div>
    )
  }

  // Hiển thị thông báo khi chưa có khách hàng
  if (!loading && customers.length === 0) {
    return (
      <div className="px-2 sm:px-6 py-12 m-2 h-[97vh] bg-primary overflow-y-scroll lg:w-4/5 rounded-xl flex items-center justify-center custom-scrollbar">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có khách hàng nào</h3>
          <p className="text-gray-500">Danh sách khách hàng sẽ hiển thị ở đây khi có người đăng ký.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-2 sm:px-6 py-12 m-2 h-[97vh] bg-primary lg:w-4/5 rounded-xl flex flex-col custom-scrollbar">
      {/* Header với nút thêm khách hàng */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Danh Sách Khách Hàng</h2>
          <p className="text-gray-600 text-sm mt-1">Tổng số: {customers.length} khách hàng</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
        >
          <FiUserPlus size={18} />
          <span className="hidden sm:inline">Thêm Khách Hàng</span>
        </button>
      </div>

      {/* Modal thêm khách hàng */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
            {/* Header modal */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Thêm Khách Hàng Mới</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Form thêm khách hàng */}
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Họ và tên */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập họ và tên"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Tối thiểu 8 ký tự"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    required
                    minLength={8}
                  />
                </div>

                {/* Tuổi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tuổi
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="Nhập tuổi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    min="1"
                    max="150"
                  />
                </div>

                {/* Giới tính */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới tính
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="0123456789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Địa chỉ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Nhập địa chỉ đầy đủ"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  Thêm Khách Hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal sửa khách hàng */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
            {/* Header modal */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Sửa Thông Tin Khách Hàng</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Form sửa khách hàng */}
            <form onSubmit={handleUpdateCustomer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Họ và tên */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập họ và tên"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    required
                  />
                </div>

                {/* Password */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu mới <span className="text-gray-500">(để trống nếu không đổi)</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Tối thiểu 8 ký tự"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    minLength={8}
                  />
                </div>

                {/* Tuổi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tuổi
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="Nhập tuổi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    min="1"
                    max="150"
                  />
                </div>

                {/* Giới tính */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới tính
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="0123456789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Địa chỉ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Nhập địa chỉ đầy đủ"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  Cập Nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Container với scrollbar ngang cố định */}
      <div className="overflow-x-auto overflow-y-scroll flex-1 custom-scrollbar">
        {/* Danh sách khách hàng dạng cards */}
        <div className="flex flex-col gap-4 min-w-[800px]">
        {customers.map((customer) => (
          <div key={customer._id} className="bg-white p-4 rounded-lg shadow-sm">
            {/* Header card với nút Edit và Delete */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800">ID: {customer._id.slice(-8)}</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditClick(customer)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs font-medium"
                  title="Chỉnh sửa"
                >
                  <FiEdit2 size={14} />
                  <span>Sửa</span>
                </button>
                <button
                  onClick={() => handleDeleteCustomer(customer._id, customer.name)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-xs font-medium"
                  title="Xóa"
                >
                  <FiTrash2 size={14} />
                  <span>Xóa</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Thông tin cơ bản */}
              <div>
                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Thông tin cá nhân</h5>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Họ và tên:</span>
                    <span className="text-sm text-gray-900">{customer.name || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Tuổi:</span>
                    <span className="text-sm text-gray-900">{customer.age || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Giới tính:</span>
                    <span className="text-sm text-gray-900">{customer.gender || 'Chưa cập nhật'}</span>
                  </div>
                </div>
              </div>

              {/* Liên hệ */}
              <div>
                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Liên hệ</h5>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Email:</span>
                    <span className="text-sm text-gray-900">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">SĐT:</span>
                    <span className="text-sm text-gray-900">{customer.phone || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-gray-700">Địa chỉ:</span>
                    <span className="text-sm text-gray-900">{customer.address || 'Chưa cập nhật'}</span>
                  </div>
                </div>
              </div>

              {/* Tài khoản */}
              <div>
                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Tài khoản</h5>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Username:</span>
                    <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-0.5 rounded">
                      {customer.email.split('@')[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Password:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-0.5 rounded">
                        {showPasswords[customer._id] ? customer.password : '••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(customer._id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title={showPasswords[customer._id] ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showPasswords[customer._id] ? (
                          <FiEyeOff className="text-gray-600" size={16} />
                        ) : (
                          <FiEye className="text-gray-600" size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Ngày tạo:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(customer.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  )
}

export default ListCustomer
