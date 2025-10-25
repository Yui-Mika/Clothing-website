// Logic xử lý Login
// Thiết kế xử lý cả hai quy trình: đăng nhập và đăng ký người dùng
import { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext"; 
import toast from "react-hot-toast";

// Xử lý đầu vào của người dùng (tên, email, mật khẩu) và gửi yêu cầu API đến máy chủ để xác thực (login) hoặc tạo tài khoản mới (register).
const Login = () => {
  /* Lấy các hàm và công cụ từ Context: setShowUserLogin (để ẩn modal đăng nhập), Maps (chuyển hướng), axios (gọi API), 
  và handleLoginSuccess (hàm xử lý sau khi đăng nhập thành công).*/
    const { setShowUserLogin, navigate, axios, handleLoginSuccess } = useContext(ShopContext);
    const [state, setState] = useState("login"); // Quản lý trạng thái hiện tại: "login" hoặc "register"
    const [name, setName] = useState(""); //Các state lưu trữ giá trị đầu vào của biểu mẫu (input fields).
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    //Logic xử lý khi người dùng gửi biểu mẫu (form)
    const onSubmitHandler = async (event) => { // Ngăn chặn hành vi mặc định của biểu mẫu (tải lại trang)
      event.preventDefault();
      try {
        const { data } = await axios.post(`/api/user/${state}`, { // Gửi yêu cầu POST đến endpoint tương ứng dựa trên trạng thái hiện tại (login hoặc register)
          name, email, password // Gửi dưới dạng JSON
        });

        // Xử lý phản hồi API (máy chủ)
        if (data.success) {
          toast.success(`${state === 'register' ? 'Account Created' : 'Login Successful'}`);
          await handleLoginSuccess();   // tải thông tin người dùng, giỏ hàng sau khi đăng nhập thành công và chuyển về trang chủ
          setShowUserLogin(false); // ẩn/đóng modal đăng nhập
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message);
      }
    };

  // Phần hiển thị JSX của component Login
  return (
    // Khung chứa toàn bộ modal đăng nhập/đăng ký
    <div onClick={() => setShowUserLogin(false)} className="fixed top-0 bottom-0 left-0 right-0 z-40 flex items-center text-sm text-gray-600 bg-black/50">
      {/* Biểu mẫu đăng nhập/đăng ký */}
      <form onSubmit={onSubmitHandler} onClick={(e) => e.stopPropagation()} className="flex flex-col gap-4 m-auto items-start p-8 py-12 w-80 sm:w-[352px] rounded-lg shadow-xl border border-gray-200 bg-white">
        {/* Tiêu đề động thay đổi dựa trên trạng thái hiện tại (login hoặc register) */}
        <h3 className="bold-28 mx-auto mb-3">
          <span className="text-secondary capitalize">User</span>{" "}
          <span className="capitalize">{state === "login" ? "login" : "register"}</span>
        </h3>
        {/* Trường nhập tên (chỉ hiển thị khi trạng thái là "register") */}
        {state === "register" && (
          <div className="w-full">
            <p>Name</p>
            <input
              onChange={(e) => setName(e.target.value)}
              value={name}
              placeholder="type here"
              className="border border-gray-200 rounded w-full p-2 mt-1 outline-tertiary"
              type="text"
              required
            />
          </div>
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
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            placeholder="type here"
            className="border border-gray-200 rounded w-full p-2 mt-1 outline-tertiary"
            type="password"
            required
          />
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
        {/* Nút submit */}
        <button type="submit" className="btn-secondary w-full !rounded !py-2.5">
          {state === "register" ? "Create Account" : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
