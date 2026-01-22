exports.sendSMS = async (phoneNumber, message) => {
  console.log(`SMS to ${phoneNumber}: ${message}`);
  return true;
};
