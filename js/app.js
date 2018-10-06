// Global Variables for access
var NUM_PRODUCTS = 11;
var PRODUCT_LABEL = "label";
var PRODUCT_IMGURL = "imageUrl";
var PRODUCT_PRICE = "price";
var PRODUCT_QUANTITY = "quantity";

// Store Object
var Store = function(initialStock) {
    this.stock = initialStock;
    this.cart = [];
}

// Adds an item to the shopping cart
Store.prototype.addItemToCart = function(itemName) {
    console.log("Add Item to Cart");

    // Check if theres any stock left
    if (this.stock[itemName][PRODUCT_QUANTITY] >= 1) {
        // Since there is stock available, add to cart
        if (itemName in this.cart) {
            this.cart[itemName]++;
        } else {
            this.cart[itemName] = 1
        }

        // Decrement from stock
        this.stock[itemName][PRODUCT_QUANTITY]--;
    } else {
        var err = "Item " + itemName + " is out of stock. Please select another item.";
        alert(err);
    }
}

// Removes an item from the shopping cart
Store.prototype.removeItemFromCart = function(itemName) {
    console.log("Remove Item from Cart");

    // Check if item exists in cart
    if (itemName in this.cart) {
        // Since its in cart, remove 1 from cart and add 1 back to stock
        this.cart[itemName]--;
        this.stock[itemName][PRODUCT_QUANTITY]++;

        // If quantity hits 0, remove the entry from cart
        if (this.cart[itemName] == 0) {
            delete this.cart[itemName];
        }
    } else {
        var err = "Item " + itemName + " is not in your cart.";
        alert(err);
    }
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
var products = [];

// Initializing products
initProd();

// Store object
var store = new Store(products);

// Function to initialize products
function initProd() {
    // Total number of products is 11
    for (var i = 0; i < NUM_PRODUCTS; i++) {
        var prod = [];
        prod[PRODUCT_LABEL] = prodLabel[i];
        prod[PRODUCT_IMGURL] = prodURL[i];
        prod[PRODUCT_PRICE] = prodPrice[i];
        prod[PRODUCT_QUANTITY] = 5;

        products[prodLabel[i]] = prod;
    }
}
