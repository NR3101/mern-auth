export const generateVerificationToken = () => {
  //generate a random 6 digit number between 100000 and 999999 and return it as a string
  return Math.floor(100000 + Math.random() * 900000).toString();
};
