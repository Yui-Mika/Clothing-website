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
          <Title title1={'Get'} title2={'in Touch'} titleStyles={"pb-5"} para={"Have questions or need help? Send us a message, and we'll get back to you as soon as possible."}/>
          <form>
            <div className='flex gap-x-5'>
              <div className="w-1/2 mb-4">
                <input
                  type="text"
                  id="name"
                  placeholder="Enter your name"
                  className="w-full mt-1 py-1.5 px-3 border-none ring-1 ring-secondary/20 rounded-sm regular-14 bg-white"
                />
              </div>
              <div className="w-1/2 mb-4">
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  className="w-full mt-1 py-1.5 px-3 border-none ring-1 ring-secondary/20 rounded-sm regular-14 bg-white"
                />
              </div>
            </div>
            <div className="mb-4">
              <textarea
                id="message"
                rows="4"
                placeholder="Write your message here"
                className="w-full mt-1 py-1.5 px-3 border-none ring-1 ring-secondary/20 rounded-sm regular-14 bg-white resize-none"
              ></textarea>
            </div>
            <button
              type="submit"
              className="btn-dark shadow-sm rounded-sm"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Contact Details */}
        <div className='flex-1'>
          {/* Title */}
          <Title title1={'Contact'} title2={'Details'} titleStyles={"pb-5"} para={'We are always here to assist you! Feel free to reach out to us through any of the following methods'}/>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <h5 className="h5 capitalize mr-4">
                location:
              </h5>
              <p className='flexStart gap-x-2'><FaLocationDot /> 123 Shopprr Street, Clothing City, FC 12345</p>
            </div>
            <div className="flex flex-col">
              <h5 className="h5 capitalize mr-4">email:</h5>
              <p className='flexStart gap-x-2'><FaEnvelope /> info@shopprr.com</p>
            </div>
            <div className="flex flex-col">
              <h5 className="h5 capitalize mr-4">phone:</h5>
              <p className='flexStart gap-x-2'><FaPhone /> +1 (800) 123-4567</p>
            </div>
            <div className="flex flex-col">
              <h5 className="h5 capitalize mr-4">
                Support:
              </h5>
              <p className='flexStart gap-x-2'><FaHeadphones /> 24/7 Support is open</p>
            </div>
          </div>
        </div>
      </div>

    </div>

  )
}

export default Contact
