import jwt from "jsonwebtoken";

//middleware to verify the token sent by the client
export const verifyToken = async (req, res, next) => {
  const token = req.cookies.token; //get the token from the cookies

  //if token is not found, return an error
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized - No Token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); //verify the token

    if (!decoded) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - Invalid Token" });
    }

    req.userId = decoded.userId; //set the user in the request object
    next(); //call the next middleware
  } catch (error) {
    console.log("Error verifying token", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
