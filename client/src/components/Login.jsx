// Logic xử lý Login
// Thiết kế xử lý cả hai quy trình: đăng nhập và đăng ký người dùng
import { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext"; 
import toast from "react-hot-toast";
import ReCAPTCHA from "react-google-recaptcha";

// Xử lý đầu vào của người dùng (tên, email, mật khẩu) và gửi yêu cầu API đến máy chủ để xác thực (login) hoặc tạo tài khoản mới (register).
const Login = () => {
  /* Lấy các hàm và công cụ từ Context: setShowUserLogin (để ẩn modal đăng nhập), Maps (chuyển hướng), axios (gọi API), 
  và handleLoginSuccess (hàm xử lý sau khi đăng nhập thành công).*/
    const { setShowUserLogin, navigate, axios, handleLoginSuccess } = useContext(ShopContext);
    const [state, setState] = useState("login"); // Quản lý trạng thái hiện tại: "login" hoặc "register"
    const [name, setName] = useState(""); //Các state lưu trữ giá trị đầu vào của biểu mẫu (input fields).
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState(""); // Ngày tháng năm sinh
    const [gender, setGender] = useState("");
    const [recaptchaToken, setRecaptchaToken] = useState("");
    const [showPassword, setShowPassword] = useState(false); // State để toggle hiển thị password

    // State để theo dõi các yêu cầu password
    const [passwordRequirements, setPasswordRequirements] = useState({
      hasMinLength: false,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumber: false,
      hasSpecialChar: false
    });

    // Kiểm tra và cập nhật trạng thái yêu cầu password khi người dùng nhập
    const handlePasswordChange = (e) => {
      const newPassword = e.target.value;
      setPassword(newPassword);

      // Cập nhật trạng thái các yêu cầu
      setPasswordRequirements({
        hasMinLength: newPassword.length >= 8,
        hasUpperCase: /[A-Z]/.test(newPassword),
        hasLowerCase: /[a-z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
        hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)
      });
    };

    // Xử lý khi reCAPTCHA được xác minh thành công
    const onChange = (token) => {
      console.log("reCAPTCHA verified:", token);
      setRecaptchaToken(token);
    };

    // Kiểm tra độ mạnh của mật khẩu
    const validatePassword = (password) => {
      const hasMinLength = password.length >= 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      
      if (!hasMinLength) {
        toast.error("Mật khẩu phải có ít nhất 8 ký tự!");
        return false;
      }
      if (!hasUpperCase) {
        toast.error("Mật khẩu phải có ít nhất 1 chữ hoa!");
        return false;
      }
      if (!hasLowerCase) {
        toast.error("Mật khẩu phải có ít nhất 1 chữ thường!");
        return false;
      }
      if (!hasNumber) {
        toast.error("Mật khẩu phải có ít nhất 1 số!");
        return false;
      }
      if (!hasSpecialChar) {
        toast.error("Mật khẩu phải có ít nhất 1 ký tự đặc biệt!");
        return false;
      }
      return true;
    };

    //Logic xử lý khi người dùng gửi biểu mẫu (form)
    const onSubmitHandler = async (event) => { // Ngăn chặn hành vi mặc định của biểu mẫu (tải lại trang)
      event.preventDefault();
      console.log('🚀 onSubmitHandler START - state:', state); // Debug log
      
      if (!recaptchaToken) {
        toast.error("Vui lòng xác nhận bạn không phải robot!");
        return;
      }

      // Kiểm tra mật khẩu khi đăng ký
      if (state === "register" && !validatePassword(password)) {
        return;
      }
      
      console.log('🔄 About to send API request to:', `/api/user/${state}`); // Debug log
      
      try {
        const { data } = await axios.post(`/api/user/${state}`, { // Gửi yêu cầu POST đến endpoint tương ứng dựa trên trạng thái hiện tại (login hoặc register)
          name, 
          email, 
          password,
          ...(state === 'register' && {
            phone: phone || undefined,
            address: address || undefined,
            dateOfBirth: dateOfBirth || undefined,
            gender: gender || undefined
          })
        });

        // Xử lý phản hồi API (máy chủ)
        console.log('✅ ========== API RESPONSE RECEIVED =========='); // Debug log
        console.log('🔍 Login response data:', data); // Debug log
        console.log('🔍 data.success:', data.success, typeof data.success); // Debug log
        console.log('🔍 data.token:', data.token ? 'exists' : 'null'); // Debug log
        console.log('🔍 data.token length:', data.token ? data.token.length : 0); // Debug log
        console.log('✅ ========================================'); // Debug log
        
        if (data.success) {
          toast.success(`${state === 'register' ? 'Tạo tài khoản thành công! Vui lòng kiểm tra email để xác thực tài khoản.' : 'Đăng nhập thành công'}`);
          
          // Chỉ đóng modal và load data khi login thành công
          // Khi register thì user cần verify email trước
          if (state === 'login') {
            console.log('🔍 Processing login - state is:', state); // Debug log
            // Lưu token vào localStorage dựa trên role
            if (data.token) {
              console.log('🔍 Token exists, attempting to decode...'); // Debug log
              // Decode JWT để lấy role (phần payload là phần giữa của JWT)
              try {
                const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
                const userRole = tokenPayload.role;
                console.log('🔍 Decoded role:', userRole); // Debug log
                
                // Xóa cả 2 tokens cũ trước khi lưu token mới
                localStorage.removeItem('user_token');
                localStorage.removeItem('admin_token');
                
                // Lưu vào đúng key dựa trên role
                if (userRole === 'admin' || userRole === 'staff') {
                  localStorage.setItem('admin_token', data.token);
                  console.log('✅ Saved admin token to localStorage');
                } else {
                  localStorage.setItem('user_token', data.token);
                  console.log('✅ Saved user token to localStorage');
                }
              } catch (error) {
                // Fallback: nếu decode thất bại, lưu vào user_token
                console.error('❌ Error decoding token:', error);
                localStorage.setItem('user_token', data.token);
                console.log('✅ Saved token to user_token (fallback)');
              }
            } else {
              console.log('⚠️ No token in response!'); // Debug log
            }
            
            // Gọi handleLoginSuccess và nhận về role để navigate đúng
            const userRole = await handleLoginSuccess();
            setShowUserLogin(false); // ẩn/đóng modal đăng nhập
            
            // Navigate dựa trên role sau khi state đã được update
            if (userRole === "admin" || userRole === "staff") {
              navigate("/admin");
            } else {
              navigate("/");
            }
          } else {
            // Đăng ký thành công - redirect đến trang verify email
            setShowUserLogin(false); // Đóng modal
            navigate('/verify-email', { 
              state: { email: data.email || email } 
            });
          }
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        // Xử lý lỗi từ backend
        if (error.response && error.response.data && error.response.data.detail) {
          // Lỗi từ FastAPI (có detail field)
          toast.error(error.response.data.detail);
        } else if (error.response && error.response.data && error.response.data.message) {
          // Lỗi có message field
          toast.error(error.response.data.message);
        } else {
          // Lỗi chung
          toast.error(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        }
      }
    };

  // Phần hiển thị JSX của component Login
  return (
    // Khung chứa toàn bộ modal đăng nhập/đăng ký
    <div onClick={() => setShowUserLogin(false)} className="fixed top-0 bottom-0 left-0 right-0 z-40 flex items-center text-sm text-gray-600 bg-black/50 overflow-y-auto py-8">
      {/* Biểu mẫu đăng nhập/đăng ký */}
      <form onSubmit={onSubmitHandler} onClick={(e) => e.stopPropagation()} className="flex flex-col gap-4 m-auto items-start p-8 py-12 w-80 sm:w-[352px] rounded-lg shadow-xl border border-gray-200 bg-white my-auto">
        {/* Tiêu đề động thay đổi dựa trên trạng thái hiện tại (login hoặc register) */}
        <h3 className="bold-28 mx-auto mb-3">
          <span className="text-secondary capitalize">User</span>{" "}
          <span className="capitalize">{state === "login" ? "login" : "register"}</span>
        </h3>
        {/* Trường nhập tên (chỉ hiển thị khi trạng thái là "register") */}
        {state === "register" && (
          <>
            <div className="w-full">
              <p>Name</p>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                placeholder="Enter your full name"
                className="border border-gray-200 rounded w-full p-2 mt-1 outline-tertiary"
                type="text"
                required
              />
            </div>

            {/* Trường số điện thoại */}
            <div className="w-full">
              <p>Phone Number</p>
              <input
                onChange={(e) => setPhone(e.target.value)}
                value={phone}
                placeholder="Enter your phone number"
                className="border border-gray-200 rounded w-full p-2 mt-1 outline-tertiary"
                type="tel"
                pattern="[0-9]{10,15}"
                title="Phone number should be 10-15 digits"
              />
            </div>

            {/* Trường địa chỉ */}
            <div className="w-full">
              <p>Address</p>
              <textarea
                onChange={(e) => setAddress(e.target.value)}
                value={address}
                placeholder="Enter your address (Street, City, Country)"
                className="border border-gray-200 rounded w-full p-2 mt-1 outline-tertiary resize-none"
                rows="2"
              />
            </div>

            {/* Trường ngày sinh và giới tính (cùng hàng) */}
            <div className="flex gap-3 w-full">
              {/* Ngày tháng năm sinh */}
              <div className="flex-1">
                <p>Date of Birth</p>
                <input
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  value={dateOfBirth}
                  className="border border-gray-200 rounded w-full p-2 mt-1 outline-tertiary"
                  type="date"
                  max={new Date().toISOString().split('T')[0]} // Không cho chọn ngày tương lai
                  min="1900-01-01" // Giới hạn năm sinh từ 1900
                />
              </div>

              {/* Giới tính */}
              <div className="flex-1">
                <p>Gender</p>
                <select
                  onChange={(e) => setGender(e.target.value)}
                  value={gender}
                  className="border border-gray-200 rounded w-full p-2 mt-1 outline-tertiary"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Trường này được hiển thị trong cả hai trạng thái đăng nhập và đăng ký */}
        <div className="w-full">
          <p>Email</p>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            placeholder="type here"
            className="border border-gray-200 rounded w-full p-2 mt-1 outline-tertiary"
            type="email"
            required
          />
        </div>
        <div className="w-full ">
          <p>Password</p>
          <div className="relative">
            <input
              onChange={handlePasswordChange}
              value={password}
              placeholder="type here"
              className="border border-gray-200 rounded w-full p-2 mt-1 pr-10 outline-tertiary"
              type={showPassword ? "text" : "password"}
              required
            />
            {/* Icon mắt để toggle hiển thị password */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {showPassword ? (
                // Icon mắt mở (đang hiển thị password)
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                // Icon mắt gạch (đang ẩn password)
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              )}
            </button>
          </div>
          {/* Hiển thị yêu cầu mật khẩu khi đang ở chế độ đăng ký */}
          {state === "register" && (
            <ul className="text-xs mt-2 space-y-1">
              <li className={`flex items-center gap-1 ${passwordRequirements.hasMinLength ? 'text-green-600' : 'text-gray-500'}`}>
                <span>{passwordRequirements.hasMinLength ? '✓' : '○'}</span>
                At least 8 characters
              </li>
              <li className={`flex items-center gap-1 ${passwordRequirements.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                <span>{passwordRequirements.hasUpperCase ? '✓' : '○'}</span>
                At least 1 uppercase letter
              </li>
              <li className={`flex items-center gap-1 ${passwordRequirements.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                <span>{passwordRequirements.hasLowerCase ? '✓' : '○'}</span>
                At least 1 lowercase letter
              </li>
              <li className={`flex items-center gap-1 ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                <span>{passwordRequirements.hasNumber ? '✓' : '○'}</span>
                At least 1 number
              </li>
              <li className={`flex items-center gap-1 ${passwordRequirements.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                <span>{passwordRequirements.hasSpecialChar ? '✓' : '○'}</span>
                At least 1 special character
              </li>
            </ul>
          )}
        </div>
        {/* Chuyển đổi giữa trạng thái đăng nhập và đăng ký */}
        {state === "register" ? (
          <p>
            Already have account?{" "}
            <span onClick={() => setState("login")} className="text-secondary cursor-pointer">
              click here
            </span>
          </p>
        ) : (
          <p>
            Create an account?{" "}
            <span onClick={() => setState("register")} className="text-secondary cursor-pointer">
              click here
            </span>
          </p>
        )}
        {/* reCAPTCHA */}
        <div className="w-full flex justify-center">
          <ReCAPTCHA
            sitekey="6Lc-tPgrAAAAAAq8WkM_mE_62TpEMIDLHwj0k8G0" // Thay bằng site key của bạn
            onChange={onChange}
          />
        </div>
        {/* Nút submit */}
        <button type="submit" className="btn-secondary w-full !rounded !py-2.5" disabled={!recaptchaToken}>
          {state === "register" ? "Create Account" : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
