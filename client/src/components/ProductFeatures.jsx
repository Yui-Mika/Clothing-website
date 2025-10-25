/* hiển thị các tính năng hoặc lợi ích chính của cửa hàng (như Chính sách Trả hàng, Giao hàng, Thanh toán) 
trên trang chi tiết sản phẩm hoặc các trang quan trọng khác */
import React from 'react'
import { RiSecurePaymentLine } from 'react-icons/ri'
import { TbArrowBackUp, TbTruckDelivery } from 'react-icons/tb'

const ProductFeatures = () => {
  return (
    <div className='mt-12 bg-white'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 rounded-xl'>
            {/* 3 khối tính năng */}
            {/* Tính năng 1 */}
            <div className='flexCenter gap-x-4 p-2 rounded-3xl'>
                <div className='text-3xl'><TbArrowBackUp className='mb-3 text-yellow-500'/></div>
                <div>
                    <h4 className='h4 capitalize'>Easy Return</h4>
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatem eaque corrupti asperiores animi, praesentium temporibus!</p>
                </div>
            </div>
            {/* Tính năng 2 */}
            <div className='flexCenter gap-x-4 p-2 rounded-3xl'>
                <div className='text-3xl'><TbTruckDelivery className='mb-3 text-red-500'/></div>
                <div>
                    <h4 className='h4 capitalize'>Fast Delivery</h4>
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatem eaque corrupti asperiores animi, praesentium temporibus!</p>
                </div>
            </div>
            {/* Tính năng 3 */}
            <div className='flexCenter gap-x-4 p-2 rounded-3xl'>
                <div className='text-3xl'><RiSecurePaymentLine className='mb-3 text-blue-500'/></div>
                <div>
                    <h4 className='h4 capitalize'>Secure Payment</h4>
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatem eaque corrupti asperiores animi, praesentium temporibus!</p>
                </div>
            </div>
        </div>
    </div>
  )
}

export default ProductFeatures