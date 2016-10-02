var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('AuthorizedRequests', new Schema({
	message    : String,
	timestamp  : String,
    userId     : String,
	userName   : String
}));