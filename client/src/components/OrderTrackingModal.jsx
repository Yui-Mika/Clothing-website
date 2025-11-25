import React from 'react';
import { FiCheck, FiClock, FiTruck, FiPackage, FiX } from 'react-icons/fi';

const OrderTrackingModal = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  // Định nghĩa các bước trong timeline
  const statusSteps = [
    { key: 'Order Placed', label: 'Đã đặt hàng', icon: FiPackage },
    { key: 'Processing', label: 'Đang xử lý', icon: FiClock },
    { key: 'Shipped', label: 'Đang giao hàng', icon: FiTruck },
    { key: 'Delivered', label: 'Đã giao hàng', icon: FiCheck }
  ];

  // Tìm index của trạng thái hiện tại
  const currentStatusIndex = statusSteps.findIndex(step => step.key === order.status);
  const isCancelled = order.status === 'Cancelled';

  // Hàm xác định trạng thái của mỗi bước
  const getStepStatus = (index) => {
    if (isCancelled) return 'cancelled';
    if (index < currentStatusIndex) return 'completed';
    if (index === currentStatusIndex) return 'current';
    return 'pending';
  };

  // Hàm lấy màu sắc dựa trên trạng thái
  const getStepColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'current':
        return 'bg-blue-500 text-white';
      case 'cancelled':
        return 'bg-gray-300 text-gray-500';
      default:
        return 'bg-gray-200 text-gray-400';
    }
  };

  // Hàm lấy màu của đường kẻ nối
  const getLineColor = (index) => {
    if (isCancelled) return 'bg-gray-300';
    if (index < currentStatusIndex) return 'bg-green-500';
    return 'bg-gray-200';
  };

  // Format ngày giờ
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Theo dõi đơn hàng #{order._id?.slice(-8)}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Thông tin đơn hàng */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Ngày đặt hàng:</p>
                <p className="font-medium">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-600">Cập nhật lần cuối:</p>
                <p className="font-medium">{formatDate(order.updatedAt)}</p>
              </div>
              <div>
                <p className="text-gray-600">Tổng tiền:</p>
                <p className="font-medium">{new Intl.NumberFormat('vi-VN').format(order.amount)}₫</p>
              </div>
              <div>
                <p className="text-gray-600">Phương thức thanh toán:</p>
                <p className="font-medium">
                  {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 
                   order.paymentMethod === 'Stripe' ? 'Stripe' : 'VNPay'}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Trường hợp bị hủy - hiển thị riêng */}
            {isCancelled ? (
              <div className="flex flex-col items-center py-8">
                <div className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center mb-4">
                  <FiX size={40} />
                </div>
                <h3 className="text-2xl font-semibold text-red-600 mb-2">Đơn hàng đã bị hủy</h3>
                <p className="text-gray-600">Đơn hàng của bạn đã bị hủy vào {formatDate(order.updatedAt)}</p>
              </div>
            ) : (
              // Timeline nằm ngang
              <div className="py-8">
                <div className="flex justify-between items-start relative">
                  {statusSteps.map((step, index) => {
                    const StepIcon = step.icon;
                    const stepStatus = getStepStatus(index);
                    const isLast = index === statusSteps.length - 1;

                    return (
                      <div key={step.key} className="flex flex-col items-center flex-1 relative">
                        {/* Đường kẻ nối nằm ngang */}
                        {!isLast && (
                          <div className={`
                            absolute top-6 left-1/2 w-full h-1
                            ${getLineColor(index)}
                            transition-colors duration-300 z-0
                          `} />
                        )}

                        {/* Icon */}
                        <div className={`
                          w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 relative
                          ${getStepColor(stepStatus)}
                          transition-colors duration-300 shadow-md
                        `}>
                          <StepIcon size={24} />
                        </div>

                        {/* Label */}
                        <div className="mt-3 text-center">
                          <h3 className={`
                            text-sm font-semibold mb-1
                            ${stepStatus === 'current' ? 'text-blue-600' : 
                              stepStatus === 'completed' ? 'text-green-600' : 
                              'text-gray-400'}
                          `}>
                            {step.label}
                          </h3>
                          
                          {/* Hiển thị thời gian cho trạng thái hiện tại */}
                          {stepStatus === 'current' && (
                            <p className="text-xs text-gray-600">
                              {formatDate(order.updatedAt)}
                            </p>
                          )}
                          
                          {/* Hiển thị thời gian cho trạng thái đã hoàn thành (nếu là bước đầu) */}
                          {stepStatus === 'completed' && index === 0 && (
                            <p className="text-xs text-gray-600">
                              {formatDate(order.createdAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Địa chỉ giao hàng */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Địa chỉ giao hàng:</h3>
            <p className="text-gray-700">{order.address.firstName} {order.address.lastName}</p>
            <p className="text-gray-700">{order.address.street}</p>
            <p className="text-gray-700">{order.address.city}, {order.address.state} {order.address.zipcode}</p>
            <p className="text-gray-700">SĐT: {order.address.phone}</p>
            {order.address.email && (
              <p className="text-gray-700">Email: {order.address.email}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <button
            onClick={onClose}
            className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingModal;
