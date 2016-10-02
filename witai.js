'use strict';

const 
  config  = require('config'),
  express = require('express'),
  fetch   = require('node-fetch');
var bdost	 = require('./bdost-framework/bdost.js');
var bdostTxt = require('./bdost-framework/bdostTxt.js');
var facebook = require('./facebook.js');

const WIT_TOKEN = (process.env.WIT_TOKEN) ? 
  process.env.WIT_TOKEN :
  config.get('WIT_TOKEN');  
exports.WIT_TOKEN = WIT_TOKEN; 

const sessions = require('./bdost-framework/bdost.js').sessions;

global.txtWelcome   = false;
global.txtBye       = false;
global.txtConfused  = false;

// Our bot actions
exports.actions = {
  send(request, response) {
    const {sessionId, context, entities} 	= request;
    const {text, quickreplies} 				= response;
    const recipientId 						= sessions[sessionId].fbid;
    const fd              					= sessions[sessionId].context;
    return new Promise(function(resolve, reject) {
      console.log("witai.js - send icerisindeyim. Text:" + text + " recipientId:" + recipientId);
      if(recipientId){

        console.log("witai.js - send icerisindeyim. Text:" + text);
        //bdost.flowDiagram(recipientId,text);

  			/*if(fd.botStatus === false){
   
			    bdost.getActiveUser(recipientId)
			      .then((body) => fd.activeUser = body)
			      .catch((err) => console.log(err));  

          fd.botStatus = true;
		  	}else{
          
          if(fd.pOne === true || fd.activeProcess === "pOne"){
            bdost.stepOne(recipientId,text);
          }
          else if(fd.pTwo === true || fd.activeProcess === "pTwo"){
            bdost.stepTwo(recipientId,text);
          }else if(fd.pPlus === true || fd.activeProcess === "pPlus"){
            bdost.stepPlus(recipientId,text);
          }else{
            if(txtWelcome = true){
              bdost.stepWelcome(recipientId,text);
            }else if(txtBye = true){
              bdost.stepGoodBye(recipientId,text);
            }else{
              bdost.stepNotRecognized(recipientId,text);
            }
          }
        }
        }else{
          console.log('Oops! Couldn\'t find user for session:', sessionId);
        }*/
        return resolve();
      }
    });
  },
  // You should implement your custom actions here
  // See https://wit.ai/docs/quickstart
  /*merge({sessionId, context, entities}){
    const recipientId = sessions[sessionId].fbid;
	  const fd          = sessions[sessionId].context;

    return new Promise(function(resolve, reject) {
		    
          if(fd.activeProcess){
            fd.step+=1;
          }

      	return resolve(context);
    });
  },*/
  welcome({sessionId, context, entities}) {
    const recipientId = sessions[sessionId].fbid;
	  const fd          = sessions[sessionId].context;

    return new Promise(function(resolve, reject) {
      return resolve(context);
    });
  },
  bye({sessionId, context, entities}) {
    const recipientId = sessions[sessionId].fbid;
    const fd          = sessions[sessionId].context;

    return new Promise(function(resolve, reject) {
      return resolve(context);
    });
  },
  confused({sessionId, context, entities}) {
    const recipientId = sessions[sessionId].fbid;
    const fd          = sessions[sessionId].context;

    return new Promise(function(resolve, reject) {
      return resolve(context);
    });
  },
  searchJob({sessionId, context, entities, text}) {
    const recipientId = sessions[sessionId].fbid;
	  const fd          = sessions[sessionId].context;

    return new Promise(function(resolve, reject) {
      console.log("searchJob icindeyim. Gelen mesaj:" + text);
      //console.log("text is: "+ text);
      fd.pOne = true;
    	return resolve(context);
    });
  },
  forgetPassword({sessionId, context, entities, text}) {
    const recipientId = sessions[sessionId].fbid;
    const fd          = sessions[sessionId].context;

    return new Promise(function(resolve, reject) {
      console.log("forgetPassword icindeyim. Gelen mesaj:" + text);
      fd.pTwo = true;
      return resolve(context);
    });
  },
  authorizedPerson({sessionId, context, entities, text}) {
    const recipientId = sessions[sessionId].fbid;
    const fd          = sessions[sessionId].context;

    return new Promise(function(resolve, reject) {
      console.log("authorizedPerson icindeyim. Gelen mesaj:" + text);
      fd.pPLus = true;
      return resolve(context);
    });
  }
  
};