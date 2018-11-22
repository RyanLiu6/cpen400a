var MongoClient = require('mongodb').MongoClient;	// require the mongodb driver

/**
 * Uses mongodb v3.1.9 - [API Documentation](http://mongodb.github.io/node-mongodb-native/3.1/api/)
 * StoreDB wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our bookstore app.
 */
function StoreDB(mongoUrl, dbName){
	if (!(this instanceof StoreDB)) return new StoreDB(mongoUrl, dbName);
	this.connected = new Promise(function(resolve, reject){
		MongoClient.connect(
			mongoUrl,
			{
				useNewUrlParser: true
			},
			function(err, client){
				if (err) reject(err);
				else {
					console.log('[MongoClient] Connected to '+mongoUrl+'/'+dbName);
					resolve(client.db(dbName));
				}
			}
		)
	});
}

/*
Query = {
    minPrice: Number|String,
    maxPrice: Number|String,
    category: String
}
 */
StoreDB.prototype.getProducts = function(queryParams){
	return this.connected.then(function(db){
		var query = {};
        
        if (queryParams != undefined) {
            if (queryParams.minPrice != undefined) {
                query.price = {
                    "$gte" : Number(queryParams.minPrice)
                }
            }

            if (queryParams.maxPrice != undefined) {
                if (query.price != undefined) {
                    query.price["$lte"] = Number(queryParams.maxPrice)
                }
                else {
                    query.price = {
                        "$lte" : Number(queryParams.maxPrice)
                    }
                }
            }

            if (queryParams.category != undefined) {
                query.category = {
                    "$eq" : queryParams.category
                }
            }
        }

        return new Promise(function(resolve, reject) {
            db.collection("products").find(query).toArray(function(err, output) {
                if (err) {
                    reject(err);
                }
                else {
                    // Construct the Products Associative Array
                    var products = {};

                    for (var i = 0; i < output.length; i++) {
                        products[output[i]["_id"]] = output[i];
                    }

                    // Prune the array
                    pruneArray(products);

                    resolve(products);
                }
            });
        })
	})
}

StoreDB.prototype.addOrder = function(order){
	return this.connected.then(function(db){
        // TODO: Implement functionality
        var cart = order["cart"];

        for (var itemName in cart) {
            var itemQuantity = cart[itemName];

            db.collection("products").updateOne(
                { label: itemName },
                { $inc: { quantity: -itemQuantity } }
            );
        }

        return new Promise(function(resolve, reject) {
            db.collection("orders").insertOne(order, function(err, output) {
                if (err) {
                    reject(err);
                }
                else {
                    var insertId = output.ops[0]["_id"];
                    resolve(insertId);
                }
            });
        });
	})
}

function pruneArray(arr) {
    for (var key in arr) {
        delete arr[key]["_id"];
    }
}

module.exports = StoreDB;
