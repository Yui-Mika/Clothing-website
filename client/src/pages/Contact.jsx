import React from 'react'
import { FaEnvelope, FaHeadphones, FaLocationDot, FaPhone } from 'react-icons/fa6'
import Title from "../components/Title"


const Contact = () => {
  return (
    <div className="max-padd-container py-28 bg-primary">
      {/* Contact Form and Details */}
      <div className="flex flex-col xl:flex-row gap-20">
        {/* Contact Form */}
        <div className='flex-1'>
          {/* Title */}
          <Title title1={'Liên hệ'} title2={'với chúng tôi'} titleStyles={"pb-5"} para={"Có thắc mắc hoặc cần hỗ trợ? Gửi tin nhắn cho chúng tôi, chúng tôi sẽ phản hồi sớm nhất có thể."}/>
          <form>
            <div className='flex gap-x-5'>
              <div className="w-1/2 mb-4">
                <input
                  type="text"
                  id="name"
                  placeholder="Nhập tên của bạn"
                  className="w-full mt-1 py-1.5 px-3 border-none ring-1 ring-secondary/20 rounded-sm regular-14 bg-white"
                />
              </div>
              <div className="w-1/2 mb-4">
                <input
                  type="email"
                  id="email"
                  placeholder="Nhập email của bạn"
                  className="w-full mt-1 py-1.5 px-3 border-none ring-1 ring-secondary/20 rounded-sm regular-14 bg-white"
                />
              </div>
            </div>
            <div className="mb-4">
              <textarea
                id="message"
                rows="4"
                placeholder="Viết tin nhắn của bạn tại đây"
                className="w-full mt-1 py-1.5 px-3 border-none ring-1 ring-secondary/20 rounded-sm regular-14 bg-white resize-none"
              ></textarea>
            </div>
            <button
              type="submit"
              className="btn-dark shadow-sm rounded-sm"
            >
              Gửi tin nhắn
            </button>
          </form>
        </div>

        {/* Contact Details */}
        <div className='flex-1'>
          {/* Title */}
          <Title title1={'Thông tin'} title2={'liên hệ'} titleStyles={"pb-5"} para={'Chúng tôi luôn sẵn sàng hỗ trợ bạn! Hãy liên hệ với chúng tôi qua bất kỳ phương thức nào sau đây'}/>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <h5 className="h5 capitalize mr-4">
                địa chỉ:
              </h5>
              <p className='flexStart gap-x-2'><FaLocationDot /> 123 Shopprr Street, Clothing City, FC 12345</p>
            </div>
            <div className="flex flex-col">
              <h5 className="h5 capitalize mr-4">email:</h5>
              <p className='flexStart gap-x-2'><FaEnvelope /> info@shopprr.com</p>
            </div>
            <div className="flex flex-col">
              <h5 className="h5 capitalize mr-4">điện thoại:</h5>
              <p className='flexStart gap-x-2'><FaPhone /> +1 (800) 123-4567</p>
            </div>
            <div className="flex flex-col">
              <h5 className="h5 capitalize mr-4">
                Hỗ trợ:
              </h5>
              <p className='flexStart gap-x-2'><FaHeadphones /> Hỗ trợ 24/7</p>
            </div>
          </div>
        </div>
      </div>

    </div>

  )
}

export default Contact
