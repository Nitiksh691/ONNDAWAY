import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  secure: true,
  // The SDK automatically uses process.env.CLOUDINARY_URL if available
});

export default cloudinary;
