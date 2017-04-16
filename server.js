//=========================================================
// Setup server
//=========================================================
const restify    = require('restify');

// Get up global vars
global.logger       = require('winston');
global.dotenv       = require('dotenv');
global.Wit          = require('node-wit').Wit,
global.alfredHelper = require('./helper.js');
global.WIT          = require('./wit.js');
global.WitClient    = new Wit({accessToken: process.env.WIT_TOKEN});

// Load env vars
dotenv.load()

alfredHelper.setLogger(logger); // Configure the logger

// Restify server Init
const server = restify.createServer({
    name    : process.env.APINAME,
    version : process.env.VERSION,
});

//=========================================================
// Middleware
//=========================================================
server.use(restify.jsonBodyParser({ mapParams: true }));
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser({ mapParams: true }));
server.use(restify.fullResponse());

//=========================================================
// Check for valid app_key param, if not then return error
//=========================================================
server.use(function (req, res, next) {
    if (req.query.app_key == process.env.app_key) {
        next();
    } else {
        // Invalid app_key, return error
        next(new restify.NotAuthorizedError('There was a problem authenticating you.'));
    }
});

//=========================================================
// Handel the root
//=========================================================
server.get('/', WIT.getRequest);

//=========================================================
// Start server and listen to messqges
//=========================================================
server.listen(process.env.PORT, function() {
   logger.info('%s listening to %s', server.name, server.url);
});
