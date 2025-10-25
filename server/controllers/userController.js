import userModel from "../models/userModel.js";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
}

// user Register Route
const userRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // checking if user is already exists or not
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }
    // validate password and checking strong password
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please Enter a valid email",
      });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please Enter a Strong password",
      });
    }

    // hash user password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });

    const user = await newUser.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie expiration time
    });
    return res.json({
      success: true,
      user: { email: user.email, name: user.name },
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// user Login Route
const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User doesn't Exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({
      success: true,
      user: { email: user.email, name: user.name },
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Check Auth
export const isAuth = async (req, res) => {
  try {
    const { userId } = req;
    const user = await userModel.findById(userId).select("-password");
    return res.json({ success: true, user });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};


// Logout User
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", cookieOptions);
    return res.json({ success: true, message: "Successfully Logged Out" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};


export { userLogin, userRegister };
