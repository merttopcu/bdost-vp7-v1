var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Reply', new Schema({
	messageId :{ type: mongoose.Schema.Types.ObjectId, ref: 'message' },
	message   : String,
	timestamp : String
}));