// Store Object
var Store = function(initialStock) {
    this.stock = initialStock;
    this.cart = new Map();
}

var size = 11;

// Adds an item to the shopping cart
Store.prototype.addItemToCart = function(itemName) {
    console.log("Add Item to Cart");
    console.log(itemName);
}

// Removes an item from the shopping cart
Store.prototype.removeItemFromCart = function(itemName) {
    console.log("Remove Item from Cart");
    console.log(itemName);
}

Store.prototype.print = function() {
    console.log("Send Help");
}

// Current products
var prodLabel = ["Box 1", "Box 2", "Dress", "Shirt", "Jeans", "Keyboard",
"Keyboard Combo", "PC", "Despacito", "JoJo's Bizarre Adventures", "Tent"];

var prodURL = ["Box1_$10.png", "Box2_$5.png", "Clothes1_$20.png",
"Clothes2_$30.png", "Jeans_$50.png", "Keyboard_$20.png", "KeyboardCombo_$40.png",
"PC1_$350.png", "despacito.png", "jojo.png", "Tent_$100.png"];

var prodPrice = [10, 5, 20, 100, 50, 20, 40, 350, 999, 30, 100];

// Products catalogue object
var products = new Map();

// Initializing products
initProd();

// Store object
var store = new Store(products);

// Function to initialize products
function initProd() {
    // Total number of products is 11
    for (var i = 0; i < size; i++) {
        var prod = new Map();
        prod.label = prodLabel[i];
        prod.imageUrl = prodURL[i];
        prod.price = prodPrice[i];
        prod.quantity = 5;

        products[i] = prod;
    }
}
