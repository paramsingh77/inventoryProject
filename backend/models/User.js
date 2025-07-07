const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

module.exports = mongoose.model('User', userSchema); 