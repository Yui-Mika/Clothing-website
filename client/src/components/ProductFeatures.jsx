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
                    <h4 className='font-bold text-lg text-gray-800 mb-2 group-hover:text-yellow-700 transition-colors'>Easy Returns</h4>
                    <p className='text-sm text-gray-600 leading-relaxed'>Return products within 7 days of purchase. No questions asked - hassle-free returns for your peace of mind.</p>
                </div>
            </div>

            {/* Feature 2 - Fast Delivery */}
            <div className='group flex items-start gap-4 p-6 rounded-xl bg-white hover:bg-gradient-to-br hover:from-red-50 hover:to-pink-50 transition-all duration-300 shadow-sm hover:shadow-md border border-transparent hover:border-red-200'>
                <div className='flex-shrink-0 w-14 h-14 flexCenter rounded-full bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-300'>
                    <TbTruckDelivery className='text-2xl'/>
                </div>
                <div className='flex-1'>
                    <h4 className='font-bold text-lg text-gray-800 mb-2 group-hover:text-red-600 transition-colors'>Fast Delivery</h4>
                    <p className='text-sm text-gray-600 leading-relaxed'>Free shipping on orders over $500. Express delivery available in 2-3 business days across the country.</p>
                </div>
            </div>

            {/* Feature 3 - Secure Payment */}
            <div className='group flex items-start gap-4 p-6 rounded-xl bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 shadow-sm hover:shadow-md border border-transparent hover:border-blue-200'>
                <div className='flex-shrink-0 w-14 h-14 flexCenter rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-300'>
                    <RiSecurePaymentLine className='text-2xl'/>
                </div>
                <div className='flex-1'>
                    <h4 className='font-bold text-lg text-gray-800 mb-2 group-hover:text-blue-600 transition-colors'>Secure Payment</h4>
                    <p className='text-sm text-gray-600 leading-relaxed'>100% secure transactions with encrypted payment gateway. Cash on delivery available for your convenience.</p>
                </div>
            </div>
        </div>
    </div>
  )
}

export default ProductFeatures