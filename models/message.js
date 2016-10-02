var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Message', new Schema({
	senderId    : String,
	recipientId : String,
	message    	: String,
	timestamp 	: String
}));