'use strict';

const crypto      = require('crypto'),
      request     = require('request'),
      config      = require('config');

var bdost         = require('./bdost-framework/bdost.js'),
    bdostTxt      = require('./bdost-framework/bdostTxt.js');
    //botAnalytics  = require('./botAnalytics.js');

// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ? 
  process.env.MESSENGER_APP_SECRET :
  config.get('FB_APP_SECRET');

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
  (process.env.MESSENGER_VALIDATION_TOKEN) :
  config.get('FB_VALIDATION_TOKEN');

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
  (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
  config.get('FB_PAGE_TOKEN');

// URL where the app is running (include protocol). Used to point to scripts and 
// assets located at this address. 
const SERVER_URL = (process.env.SERVER_URL) ?
  (process.env.SERVER_URL) :
  config.get('SERVER_URL');

// modified by alperen.
function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  /*console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);*/

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  
  // added by alperen
  var sessionUser = bdost.findOrCreateSession(senderID);
  var fd          = bdost.sessions[sessionUser].context;
  fd.botStatus    = true;
  
  if(payload === "PAYLOAD_MODELONE"){
     bdost.saveMessage(senderID, null, bdostTxt.modelOne);
    setTimeout(function() {
      bdost.flowDiagram(senderID,bdostTxt.modelOne);
    }, 10)
  }else if(payload === "PAYLOAD_MODELPLUS"){
     bdost.saveMessage(senderID, null, bdostTxt.modelPlus);
     setTimeout(function() {
     bdost.flowDiagram(senderID,bdostTxt.modelPlus);
     }, 10)
  }else if(payload === "PAYLOAD_RUNAGAIN"){
     fd.botStatus   = true;
     bdost.clearSessionProcesses(senderID);
     bdost.clearSessionVariables(senderID);
     bdost.saveMessage(senderID, null, bdostTxt.txtAgain);
     setTimeout(function() {
     sendTextMessage(senderID,bdostTxt.txtAgain);
     }, 10)
  }else{
    sendButtonMessage(senderID);
  }
}

// modified by alperen.
/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message' 
 * object format can vary depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some 
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've 
 * created. If we receive a message with an attachment (image, video, audio), 
 * then we'll simply confirm that we've received the attachment.
 * 
 */
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  /*console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));*/

  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;

  if (isEcho) {
    // Just logging message echoes to console
    /*console.log("Received echo for message %s and app %d with metadata %s", 
      messageId, appId, metadata);*/
    return;
  } else if (quickReply) {
    var quickReplyPayload = quickReply.payload;
    /*console.log("Quick reply for message %s with payload %s",
      messageId, quickReplyPayload);*/

    // added by alperen  
    var sessionUser = bdost.findOrCreateSession(senderID);

    if(quickReplyPayload){
      bdost.sessions[sessionUser].context.botStatus = true;
    }
   
    // removed by alperen
    //return; 
  }

  if (messageText) {
    //console.log('facebook.js - receivedMessage icerisindeyim.');
  
    bdost.saveMessage(senderID, null, messageText);
    setTimeout(function() {
     bdost.flowDiagram(senderID,messageText);
    }, 10)

  }else if (messageAttachments) {
    sendTextMessage(senderID, bdostTxt.txtAttachment);
  }
}

// modified by alperen.
/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendQuickReply(recipientId, username, dbProcess) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: username,
      metadata: "DEVELOPER_DEFINED_METADATA",
      quick_replies: [
        {
          "content_type":"text",
          "title": bdostTxt.modelOne,
          "payload":"PAYLOAD_MODELONE"
        },
        {
          "content_type":"text",
          "title": bdostTxt.modelPlus,
          "payload":"PAYLOAD_MODELPLUS"
        }
      ]
    }
  };
  bdost.saveMessage(null, recipientId, username, dbProcess);
  //botAnalytics.track(recipientId,messageData.message,new Date().getTime());
  callSendAPI(messageData);
}

// modified by alperen.
/*
 * Send a button message using the Send API.
 *
 */
function sendButtonMessage(recipientId, dbProcess) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: bdostTxt.txtConfused,
          buttons:[{
            type: "postback",
            title: bdostTxt.modelOne,
            payload: "PAYLOAD_MODELONE"
          }, {
            type: "postback",
            title: bdostTxt.modelPlus,
            payload: "PAYLOAD_MODELPLUS"
          }]
        }
      }
    }
  };  
  
  bdost.saveMessage(null, recipientId, messageData.message.attachment.payload.text, dbProcess);
  //botAnalytics.track(recipientId,messageData.message,new Date().getTime());
  callSendAPI(messageData);
}

// modified by alperen.
/*
 * Send a Structured Message (Generic Message type) using the Send API.
 *
 */
function sendGenericMessage(recipientId,attachment) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: attachment
  };  
  console.log(messageData.message.attachment.payload.elements.length);

  for(var i=0; i < messageData.message.attachment.payload.elements.length; i++){
    console.log(messageData.message.attachment.payload.elements[i].buttons[0].url);
    bdost.saveMessage(null,recipientId, messageData.message.attachment.payload.elements[i].buttons[0].url,"link");
  }
  
  //botAnalytics.track(recipientId,messageData.message,new Date().getTime());
  callSendAPI(messageData);
}

// modified by alperen.
/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(recipientId, messageText, dbProcess) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: "DEVELOPER_DEFINED_METADATA"
    }
  };
  
  bdost.saveMessage(null, recipientId, messageText,dbProcess);

  //botAnalytics.track(recipientId,messageData.message,new Date().getTime());
  callSendAPI(messageData);
}

// created by alperen.
function sendRunAgainMessage(recipientId, dbProcess) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: bdostTxt.MPContinue,
          buttons:[{
            type: "postback",
            title: "Tekrar "+bdostTxt.productName,
            payload: "PAYLOAD_RUNAGAIN"
          }]
        }
      }
    }
  };  
  bdost.saveMessage(null, recipientId, messageData.message.attachment.payload.text,dbProcess);
  //botAnalytics.track(recipientId,messageData.message,new Date().getTime());
  callSendAPI(messageData);
}

// created by alperen.
function sendLink(recipientId,text,title,url,dbProcess) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: text,
          buttons:[{
            type: "web_url",
            url: url, 
            title: title
          }]
        }
      }
    }
  };  

  setTimeout(function() {
    bdost.saveMessage(null, recipientId, text,dbProcess);
    bdost.saveMessage(null,recipientId, url,"link");
  }, 10)
  //botAnalytics.track(recipientId,messageData.message,new Date().getTime());
  callSendAPI(messageData);
}

// created by alperen.
function sendModelOneCTA(recipientId, message, dbProcess) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: message,
      metadata: "DEVELOPER_DEFINED_METADATA",
      quick_replies: [
        {
          "content_type":"text",
          "title": bdostTxt.MOCTA,
          "payload":"PAYLOAD_MODELONE"
        }
      ]
    }
  };
  
  bdost.saveMessage(null, recipientId, message, dbProcess);
  //botAnalytics.track(recipientId,messageData.message,new Date().getTime());
  callSendAPI(messageData);
}

// created by alperen.
function sendQuestion(recipientId, questionCode, dbProcess) {

  var qFile = JSON.parse(fs.readFileSync(__dirname + bdostTxt.questions));
  var q = qFile.questions[questionCode-1].question;

  var question = q.question;
  var answers = q.answers;


  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: question,
      metadata: "DEVELOPER_DEFINED_METADATA",
      quick_replies: [
        {
          "content_type":"text",
          "title": answers[0],
          "payload":"PAYLOAD_MODELONE"
        },
        {
          "content_type":"text",
          "title": answers[1],
          "payload":"PAYLOAD_MODELONE"
        },
        {
          "content_type":"text",
          "title": answers[2],
          "payload":"PAYLOAD_MODELONE"
        },
        {
          "content_type":"text",
          "title": answers[3],
          "payload":"PAYLOAD_MODELONE"
        }
      ]
    }
  };
  
  bdost.saveMessage(null, recipientId, question, dbProcess);
  //botAnalytics.track(recipientId,messageData.message,new Date().getTime());
  callSendAPI(messageData);
}


// created by alperen.
function addPersistentMenu(){
 request({
    url: 'https://graph.facebook.com/v2.6/me/thread_settings',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json:{
        setting_type : "call_to_actions",
        thread_state : "existing_thread",
        call_to_actions:[
            {
              type:"postback",
              title:bdostTxt.modelOne,
              payload:"PAYLOAD_MODELONE"
            },
            {
              type:"postback",
              title:bdostTxt.modelPlus,
              payload:"PAYLOAD_MODELPLUS"
            }
          ]
    },

}, function(error, response, body) {
      //console.log(response)
      if (error) {
          console.log('Error sending messages: ', error)
      } else if (response.body.error) {
          console.log('Error: ', response.body.error)
      }
    })
}

// created by alperen.
function addGreetingPage(){

 request({
    url: 'https://graph.facebook.com/v2.6/me/thread_settings',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json:{
        setting_type : "greeting",
        greeting : {
          text: bdostTxt.productName
        }
    },

}, function(error, response, body) {
      //console.log(response)
      if (error) {
          console.log('Error sending messages: ', error)
      } else if (response.body.error) {
          console.log('Error: ', response.body.error)
      }
    })
}

function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an 
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

function receivedAuthentication(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfAuth = event.timestamp;

  // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
  // The developer can set this to an arbitrary value to associate the 
  // authentication callback with the 'Send to Messenger' click event. This is
  // a way to do account linking when the user clicks the 'Send to Messenger' 
  // plugin.
  var passThroughParam = event.optin.ref;

  console.log("Received authentication for user %d and page %d with pass " +
    "through param '%s' at %d", senderID, recipientID, passThroughParam, 
    timeOfAuth);

  // When an authentication is received, we'll send a message back to the sender
  // to let them know it was successful.
  sendTextMessage(senderID, "Authentication successful");
}

function receivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function(messageID) {
      console.log("Received delivery confirmation for message ID: %s", 
        messageID);
    });
  }

  console.log("All message before %d were delivered.", watermark);
}

function receivedMessageRead(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark;
  var sequenceNumber = event.read.seq;

  console.log("Received message read event for watermark %d and sequence " +
    "number %d", watermark, sequenceNumber);
}

function receivedAccountLink(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  console.log("Received account link event with for user %d with status %s " +
    "and auth code %s ", senderID, status, authCode);
}

/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/assets/rift.png"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a Gif using the Send API.
 *
 */
function sendGifMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/assets/instagram_logo.gif"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send audio using the Send API.
 *
 */
function sendAudioMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "audio",
        payload: {
          url: SERVER_URL + "/assets/sample.mp3"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 *
 */
function sendVideoMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "video",
        payload: {
          url: SERVER_URL + "/assets/allofus480.mov"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 *
 */
function sendFileMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "file",
        payload: {
          url: SERVER_URL + "/assets/test.txt"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a receipt message using the Send API.
 *
 */
function sendReceiptMessage(recipientId) {
  // Generate a random receipt ID as the API requires a unique ID
  var receiptId = "order" + Math.floor(Math.random()*1000);

  var messageData = {
    recipient: {
      id: recipientId
    },
    message:{
      attachment: {
        type: "template",
        payload: {
          template_type: "receipt",
          recipient_name: "Peter Chang",
          order_number: receiptId,
          currency: "USD",
          payment_method: "Visa 1234",        
          timestamp: "1428444852", 
          elements: [{
            title: "Oculus Rift",
            subtitle: "Includes: headset, sensor, remote",
            quantity: 1,
            price: 599.00,
            currency: "USD",
            image_url: SERVER_URL + "/assets/riftsq.png"
          }, {
            title: "Samsung Gear VR",
            subtitle: "Frost White",
            quantity: 1,
            price: 99.99,
            currency: "USD",
            image_url: SERVER_URL + "/assets/gearvrsq.png"
          }],
          address: {
            street_1: "1 Hacker Way",
            street_2: "",
            city: "Menlo Park",
            postal_code: "94025",
            state: "CA",
            country: "US"
          },
          summary: {
            subtotal: 698.99,
            shipping_cost: 20.00,
            total_tax: 57.67,
            total_cost: 626.66
          },
          adjustments: [{
            name: "New Customer Discount",
            amount: -50
          }, {
            name: "$100 Off Coupon",
            amount: -100
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 *
 */
function sendReadReceipt(recipientId) {
  console.log("Sending a read receipt to mark message as seen");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "mark_seen"
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {
  console.log("Turning typing indicator on");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_on"
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {
  console.log("Turning typing indicator off");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_off"
  };

  callSendAPI(messageData);
}

/*
 * Send a message with the account linking call-to-action
 *
 */
function sendAccountLinking(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Welcome. Link your account.",
          buttons:[{
            type: "account_link",
            url: SERVER_URL + "/authorize"
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s", 
          messageId, recipientId);
      } else {
      console.log("Successfully called Send API for recipient %s", 
        recipientId);
      }
    } else {
      console.error(response.error);
    }
  });  
}

// used by API itself
exports.verifyRequestSignature        = verifyRequestSignature;
exports.receivedAuthentication        = receivedAuthentication;
exports.receivedMessageRead           = receivedMessageRead;
exports.receivedAccountLink           = receivedAccountLink; 
exports.receivedDeliveryConfirmation  = receivedDeliveryConfirmation;
exports.addPersistentMenu             = addPersistentMenu;
exports.addGreetingPage               = addGreetingPage;

exports.SERVER_URL                    = SERVER_URL;
exports.APP_SECRET                    = APP_SECRET;
exports.VALIDATION_TOKEN              = VALIDATION_TOKEN;
exports.PAGE_ACCESS_TOKEN             = PAGE_ACCESS_TOKEN;

// used by bdost-framework
exports.receivedMessage               = receivedMessage;
exports.receivedPostback              = receivedPostback;
exports.sendTextMessage               = sendTextMessage;
exports.sendQuickReply                = sendQuickReply;
exports.sendButtonMessage             = sendButtonMessage;
exports.sendGenericMessage            = sendGenericMessage;
exports.sendRunAgainMessage           = sendRunAgainMessage;
exports.sendLink                      = sendLink;
exports.sendModelOneCTA               = sendModelOneCTA;
exports.sendQuestion                  = sendQuestion;