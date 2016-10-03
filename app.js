/* jshint node: true, devel: true */
'use strict';

const 
  bodyParser = require('body-parser'),
  config     = require('config'),
  crypto     = require('crypto'),
  express    = require('express'),
  https      = require('https'),
  fetch      = require('node-fetch'),  
  request    = require('request');
  //Wit        = require('node-wit').Wit,
  //log        = require('node-wit').log;

var app          = express();

var //witai        = require('./witai.js'),
    //botAnalytics = require('./botAnalytics.js'),
    facebook     = require('./facebook.js'),
    bdost        = require('./bdost-framework/bdost.js'),
    bdostTxt     = require('./bdost-framework/bdostTxt.js');

// Check config values && witai.WIT_TOKEN
if (!(facebook.APP_SECRET && facebook.VALIDATION_TOKEN && facebook.APP_SECRET && facebook.PAGE_ACCESS_TOKEN && facebook.APP_SECRET && facebook.SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}

app.set('port', process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.use(bodyParser.json({ verify: facebook.verifyRequestSignature }));
app.use(express.static('public'));

//facebook greeting page
facebook.addGreetingPage();

//facebook persistent menu
facebook.addPersistentMenu();

// Wit.ai parameters
/*
let FB_VERIFY_TOKEN = null;
crypto.randomBytes(8, (err, buff) => {
  if (err) throw err;
  FB_VERIFY_TOKEN = buff.toString('hex');
  console.log(`/webhook will accept the Verify Token "${FB_VERIFY_TOKEN}"`);
});

const actions  = require('./witai.js').actions;
const sessions = require('./bdost-framework/bdost.js').sessions;

// Setting up our bot

const wit = new Wit({
  accessToken: witai.WIT_TOKEN,
  actions,
  logger: new log.Logger(log.INFO)
});
*/
/*
 * Use your own validation token. Check that the token used in the Webhook 
 * setup is the same token used here.
 *
 */
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === facebook.VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page. 
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook', function (req, res) {
  var data = req.body;

  //Bot Analytics
  //botAnalytics.track(null,req.body,new Date().getTime());

  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched

    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.optin) {
          facebook.receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          
          bdost.findOrCreateProcess(messagingEvent.sender.id);

          //wit.ai
          /*const senderID = messagingEvent.sender.id;
          const sessionId = bdost.findOrCreateSession(senderID);

          const {text, attachments} = messagingEvent.message;


          
          if (attachments) {
            // We received an attachment
            // Let's reply with an automatic message
            facebook.sendTextMessage(senderID, bdostTxt.txtAttachment);
          } else if (text) {
            // We received a text message

            // Let's forward the message to the Wit.ai Bot Engine
            // This will run all actions until our bot has nothing left to do
            wit.runActions(
              sessionId, // the user's current session
              text, // the user's message
              sessions[sessionId].context // the user's current session state
            ).then((context) => {
              // Our bot did everything it has to do.
              // Now it's waiting for further messages to proceed.
              console.log('Waiting for next user messages');

              // Based on the session state, you might want to reset the session.
              // This depends heavily on the business logic of your bot.
              // Example:
              // if (context['done']) {
              //   delete sessions[sessionId];
              // }

              // Updating the user's current session state
              sessions[sessionId].context = context;
            })
            .catch((err) => {
              console.error('Oops! Got an error from Wit: ', err.stack || err);
            })
          }*/

          facebook.receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          facebook.receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          facebook.receivedPostback(messagingEvent);
        } else if (messagingEvent.read) {
          facebook.receivedMessageRead(messagingEvent);
        } else if (messagingEvent.account_linking) {
          facebook.receivedAccountLink(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've 
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});

/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL. 
 * 
 */
app.get('/authorize', function(req, res) {
  var accountLinkingToken = req.query['account_linking_token'];
  var redirectURI = req.query['redirect_uri'];

  // Authorization Code should be generated per user by the developer. This will 
  // be passed to the Account Linking callback.
  var authCode = "1234567890";

  // Redirect users to this URI on successful login
  var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

  res.render('authorize', {
    accountLinkingToken: accountLinkingToken,
    redirectURI: redirectURI,
    redirectURISuccess: redirectURISuccess
  });
});

/*app.get('/device', function(req, res) {
  res.sendFile(__dirname + '/public/device.html');
});*/

exports = module.exports = app;

app.listen(app.get('port'), function() {
  console.log('bdost-framework is running on port', app.get('port'));
});
