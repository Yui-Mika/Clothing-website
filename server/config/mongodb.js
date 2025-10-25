// import mongoose from "mongoose";

// const connectDB = async ()=> {
//     mongoose.connection.on('connected', ()=>{
//         console.log("DB Connected")
//     })

//     await mongoose.connect(`${process.env.MONGO_URI}`)
// }

// export default connectDB;

import mongoose from "mongoose";

const connectDB = async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/shopprr`);
        console.log("✔ Database Connected")
    } catch (error) {
        console.error("❌ Database connection failed: ", error.message)
    }
}

export default connectDB