import jwt from "jsonwebtoken";

// function to generate a jwt token and set it as a cookie in the response
export const generateTokenAndSetCookie = (res, userId) => {
  //generate a jwt token with the userId so that the user can be identified later
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d", //expires in 7 days
  });

  //set the token as a cookie in the response
  res.cookie("token", token, {
    httpOnly: true, //cookie cannot be accessed by client side javascript
    secure: process.env.NODE_ENV === "production", //cookie will only be sent over https in production
    sameSite: "strict", //cookie will only be sent to the same site
    maxAge: 7 * 24 * 60 * 60 * 1000, // expires in 7 days
  });

  return token;
};
