'use strict';

const request = require('request'),
	  config  = require('config');

const BOT_ANALYTICS_TOKEN = (process.env.BOT_ANALYTICS_TOKEN) ? 
  process.env.BOT_ANALYTICS_TOKEN :
  config.get('BOT_ANALYTICS_TOKEN');

function track(recipient,message,timestamp){
  	request({
        url: 'http://botanalytics.co/api/v1/track',
        body: JSON.stringify({message: message,
        recipient: recipient,
        token: BOT_ANALYTICS_TOKEN,
        timestamp:timestamp}),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
	}, function(error, response, body){
	    if(error) {
	      console.log(error)
	    } else {
	      console.log(response.statusCode, body)
	    }
	})
}

function engage(first_name,last_name,profile_pic,locale,timezone,gender,user_id){
  	request({
        url: 'http://botanalytics.co/api/v1/engage',
        body: JSON.stringify({first_name: first_name,
        last_name: last_name,
        token: BOT_ANALYTICS_TOKEN,
        profile_pic:profile_pic,
        locale:locale,
        timezone:timezone,
        gender:gender,
        user_id:user_id
        }),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
	}, function(error, response, body){
	    if(error) {
	      console.log(error)
	    } else {
	      console.log(response.statusCode, body)
	    }
	})
}

exports.track 				      = track;
exports.engage              = engage
exports.BOT_ANALYTICS_TOKEN = BOT_ANALYTICS_TOKEN;