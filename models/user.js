var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
	userId 	   : String,
	fullName   : String,
	profilePic : String,
	gender     : String,
	locale     : String,
	timezone   : String,
	firstSeen  : String,
	lastSeen   : String
}));