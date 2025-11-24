import React, { useContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { ShopContext } from "../../context/ShopContext";
import { FiEdit2, FiTrash2, FiPlus, FiX, FiCheck, FiAlertCircle } from "react-icons/fi";

// Component quản lý Settings (Shipping Fee & Tax Rate)
const Settings = () => {
  const { axios, fetchSettings } = useContext(ShopContext);
  
  // States
  const [settingsList, setSettingsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" hoặc "edit"
  const [editingYear, setEditingYear] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    shippingFee: 10,
    taxRate: 2, // Display as percentage (2% instead of 0.02)
    isActive: true
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Fetch all settings từ backend
  const fetchAllSettings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/admin/settings");
      if (data.success) {
        setSettingsList(data.settings);
      } else {
        toast.error(data.message || "Không thể tải cài đặt");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Không thể tải cài đặt");
    } finally {
      setLoading(false);
    }
  };

  // Load settings khi component mount
  useEffect(() => {
    fetchAllSettings();
  }, []);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Validate year
    if (!formData.year || formData.year < 2000 || formData.year > 2100) {
      newErrors.year = "Year must be between 2000 and 2100";
    }
    
    // Check year uniqueness (chỉ khi create hoặc edit sang năm khác)
    if (modalMode === "create" || (modalMode === "edit" && formData.year !== editingYear)) {
      const yearExists = settingsList.some(s => s.year === parseInt(formData.year));
      if (yearExists) {
        newErrors.year = "Settings for this year already exist";
      }
    }
    
    // Validate shipping fee
    if (formData.shippingFee < 0) {
      newErrors.shippingFee = "Shipping fee must be non-negative";
    }
    
    // Validate tax rate
    if (formData.taxRate < 0 || formData.taxRate > 100) {
      newErrors.taxRate = "Tax rate must be between 0% and 100%";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    // Clear error khi user sửa
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Open modal để tạo mới
  const openCreateModal = () => {
    setModalMode("create");
    setFormData({
      year: new Date().getFullYear(),
      shippingFee: 10,
      taxRate: 2,
      isActive: true
    });
    setErrors({});
    setShowModal(true);
  };

  // Open modal để edit
  const openEditModal = (setting) => {
    setModalMode("edit");
    setEditingYear(setting.year);
    setFormData({
      year: setting.year,
      shippingFee: setting.shippingFee,
      taxRate: setting.taxRate * 100, // Convert 0.02 -> 2%
      isActive: setting.isActive
    });
    setErrors({});
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingYear(null);
    setFormData({
      year: new Date().getFullYear(),
      shippingFee: 10,
      taxRate: 2,
      isActive: true
    });
    setErrors({});
  };

  // Handle Create
  const handleCreate = async () => {
    if (!validateForm()) {
      toast.error("Vui lòng sửa các lỗi xác thực");
      return;
    }

    try {
      const payload = {
        year: parseInt(formData.year),
        shippingFee: parseFloat(formData.shippingFee),
        taxRate: parseFloat(formData.taxRate) / 100, // Convert 2% -> 0.02
        isActive: formData.isActive
      };

      const { data } = await axios.post("/api/admin/settings", payload);
      
      if (data.success) {
        toast.success(data.message);
        await fetchAllSettings();
        await fetchSettings(); // Update context settings
        closeModal();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error creating settings:", error);
      toast.error(error.response?.data?.detail || "Không thể tạo cài đặt");
    }
  };

  // Handle Update
  const handleUpdate = async () => {
    if (!validateForm()) {
      toast.error("Vui lòng sửa các lỗi xác thực");
      return;
    }

    try {
      const payload = {
        shippingFee: parseFloat(formData.shippingFee),
        taxRate: parseFloat(formData.taxRate) / 100, // Convert 2% -> 0.02
        isActive: formData.isActive
      };

      const { data } = await axios.put(`/api/admin/settings/${editingYear}`, payload);
      
      if (data.success) {
        toast.success(data.message);
        await fetchAllSettings();
        await fetchSettings(); // Update context settings
        closeModal();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error(error.response?.data?.detail || "Không thể cập nhật cài đặt");
    }
  };

  // Handle Delete (soft delete)
  const handleDelete = async (year) => {
    if (!confirm(`Are you sure you want to deactivate settings for year ${year}?`)) {
      return;
    }

    try {
      const { data } = await axios.delete(`/api/admin/settings/${year}`);
      
      if (data.success) {
        toast.success(data.message);
        await fetchAllSettings();
        await fetchSettings(); // Update context settings
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error deleting settings:", error);
      toast.error(error.response?.data?.detail || "Không thể xóa cài đặt");
    }
  };

  // Handle Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalMode === "create") {
      handleCreate();
    } else {
      handleUpdate();
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản Lý Cài Đặt Phí</h2>
          <p className="text-sm text-gray-600 mt-1">Quản lý phí vận chuyển và thuế theo năm</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <FiPlus size={20} />
          Thêm Năm Mới
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Năm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phí Vận Chuyển
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thuế
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng Thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settingsList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      <FiAlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
                      <p className="text-lg">Chưa có cài đặt nào</p>
                      <p className="text-sm mt-2">Nhấn "Thêm Năm Mới" để tạo cài đặt</p>
                    </td>
                  </tr>
                ) : (
                  settingsList.map((setting) => (
                    <tr key={setting.year} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{setting.year}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{new Intl.NumberFormat('vi-VN').format(setting.shippingFee)}₫</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{(setting.taxRate * 100).toFixed(0)}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          setting.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {setting.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(setting)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Edit"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(setting.year)}
                          className="text-red-600 hover:text-red-900"
                          title="Deactivate"
                          disabled={!setting.isActive}
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="text-blue-600 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Active settings for the current year will be used for new orders</li>
                  <li>Past orders retain their original fee snapshots even if settings change</li>
                  <li>Deleting settings performs a soft delete (sets isActive to false)</li>
                  <li>Each year can only have one settings configuration</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {modalMode === "create" ? "Thêm Cài Đặt Mới" : "Chỉnh Sửa Cài Đặt"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Năm <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  disabled={modalMode === "edit"}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.year ? 'border-red-500' : 'border-gray-300'
                  } ${modalMode === "edit" ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="2025"
                  min="2000"
                  max="2100"
                />
                {errors.year && (
                  <p className="mt-1 text-sm text-red-600">{errors.year}</p>
                )}
              </div>

              {/* Shipping Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phí Vận Chuyển (₫) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="shippingFee"
                  value={formData.shippingFee}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.shippingFee ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="30000"
                  min="0"
                  step="1000"
                />
                {errors.shippingFee && (
                  <p className="mt-1 text-sm text-red-600">{errors.shippingFee}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Phí vận chuyển mặc định cho đơn hàng</p>
              </div>

              {/* Tax Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thuế (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="taxRate"
                  value={formData.taxRate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.taxRate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="2"
                  min="0"
                  max="100"
                  step="0.01"
                />
                {errors.taxRate && (
                  <p className="mt-1 text-sm text-red-600">{errors.taxRate}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Tỷ lệ thuế áp dụng cho tất cả sản phẩm</p>
              </div>

              {/* Is Active */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  id="isActive"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Kích Hoạt
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                >
                  <FiCheck size={18} />
                  {modalMode === "create" ? "Tạo Mới" : "Cập Nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
