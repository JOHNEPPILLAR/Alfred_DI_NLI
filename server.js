//=========================================================
// Setup server
//=========================================================
const restify = require('restify'),
      dotenv  = require('dotenv'),
      WIT     = require('./wit.js');

// Load env vars
dotenv.load()

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
   console.log('%s listening to %s', server.name, server.url);
});
