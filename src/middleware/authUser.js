import jsonwebtoken from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";

const authUser = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401);
    throw new ApiError(401, "Unauthorized");
  }
  try {
    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401);
    console.error("JWT verification failed:", error);
    throw new ApiError(401, "Unauthorized");
  }
};

export default authUser;  
