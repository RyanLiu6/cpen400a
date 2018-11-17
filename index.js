// Require dependencies
var path = require('path');
var express = require('express');
var StoreDB = require("./StoreDB");

// Declare application parameters
var PORT = process.env.PORT || 3000;
var STATIC_ROOT = path.resolve(__dirname, './public');
var MONGO_URL = "mongodb://localhost:27017";
var DB_NAME = "cpen400a-bookstore";
var ERR_MSG = {
    error : "Press F for respects :'("
};

// Defining CORS middleware to enable CORS.
// (should really be using "express-cors",
// but this function is provided to show what is really going on when we say "we enable CORS")
function cors(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  	res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS,PUT");
  	next();
}

// Instantiate the database
var db = new StoreDB(MONGO_URL, DB_NAME);

// Instantiate an express.js application
var app = express();

// Configure the app to use a bunch of middlewares
app.use(express.json());							// handles JSON payload
app.use(express.urlencoded({ extended : true }));	// handles URL encoded payload
app.use(cors);										// Enable CORS

app.use('/', express.static(STATIC_ROOT));			// Serve STATIC_ROOT at URL "/" as a static resource

// Configure '/products' endpoint
app.get('/products', function(request, response) {
    // console.log(request.body);

    var findPromise = db.getProducts(null);

    findPromise.then(
        function(result) {
            response.json(result);
        },

        function(err) {
            response.status(500).send(ERR_MSG);
        }
    );
});

// Start listening on TCP port
app.listen(PORT, function(){
    console.log('Express.js server started, listening on PORT '+PORT);
});
