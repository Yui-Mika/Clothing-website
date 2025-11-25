/* hiển thị các tính năng hoặc lợi ích chính của cửa hàng (như Chính sách Trả hàng, Giao hàng, Thanh toán) 
trên trang chi tiết sản phẩm hoặc các trang quan trọng khác */
import React from 'react'
import { RiSecurePaymentLine } from 'react-icons/ri'
import { TbArrowBackUp, TbTruckDelivery } from 'react-icons/tb'

const ProductFeatures = () => {
  return (
    <div className='mt-12 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm border border-gray-100 p-8'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'>
            {/* Feature 1 - Easy Return */}
            <div className='group flex items-start gap-4 p-6 rounded-xl bg-white hover:bg-gradient-to-br hover:from-yellow-50 hover:to-orange-50 transition-all duration-300 shadow-sm hover:shadow-md border border-transparent hover:border-yellow-200'>
                <div className='flex-shrink-0 w-14 h-14 flexCenter rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg group-hover:scale-110 transition-transform duration-300'>
                    <TbArrowBackUp className='text-2xl'/>
                </div>
                <div className='flex-1'>
                    <h4 className='font-bold text-lg text-gray-800 mb-2 group-hover:text-yellow-700 transition-colors'>Đổi trả dễ dàng</h4>
                    <p className='text-sm text-gray-600 leading-relaxed'>Trả lại sản phẩm trong vòng 7 ngày kể từ ngày mua. Không cần hỏi - đổi trả dễ dàng để bạn yên tâm.</p>
                </div>
            </div>

            {/* Feature 2 - Fast Delivery */}
            <div className='group flex items-start gap-4 p-6 rounded-xl bg-white hover:bg-gradient-to-br hover:from-red-50 hover:to-pink-50 transition-all duration-300 shadow-sm hover:shadow-md border border-transparent hover:border-red-200'>
                <div className='flex-shrink-0 w-14 h-14 flexCenter rounded-full bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-300'>
                    <TbTruckDelivery className='text-2xl'/>
                </div>
                <div className='flex-1'>
                    <h4 className='font-bold text-lg text-gray-800 mb-2 group-hover:text-red-600 transition-colors'>Giao hàng nhanh</h4>
                    <p className='text-sm text-gray-600 leading-relaxed'>Giao hàng miễn phí cho đơn hàng trên 2.400.000đ. Giao hàng nhanh trong 2-3 ngày làm việc trên toàn quốc.</p>
                </div>
            </div>

            {/* Feature 3 - Secure Payment */}
            <div className='group flex items-start gap-4 p-6 rounded-xl bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 shadow-sm hover:shadow-md border border-transparent hover:border-blue-200'>
                <div className='flex-shrink-0 w-14 h-14 flexCenter rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-300'>
                    <RiSecurePaymentLine className='text-2xl'/>
                </div>
                <div className='flex-1'>
                    <h4 className='font-bold text-lg text-gray-800 mb-2 group-hover:text-blue-600 transition-colors'>Thanh toán an toàn</h4>
                    <p className='text-sm text-gray-600 leading-relaxed'>Giao dịch 100% an toàn với cổng thanh toán được mã hóa. Thanh toán khi nhận hàng tiện lợi cho bạn.</p>
                </div>
            </div>
        </div>
    </div>
  )
}

export default ProductFeatures