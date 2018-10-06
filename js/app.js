// Global Variables for access
var NUM_PRODUCTS = 11;
var PRODUCT_LABEL = "label";
var PRODUCT_IMGURL = "imageUrl";
var PRODUCT_PRICE = "price";
var PRODUCT_QUANTITY = "quantity";

// Product Information - could be replaced with document.getElementBy ...
var prodLabel = ["Box 1", "Box 2", "Dress", "Shirt", "Jeans", "Keyboard",
"Alexa", "Play", "Despacito", "PC", "JoJo's Bizarre Adventures", "Tent"];

var prodURL = ["images/Box1_$10.png", "Box2_$5.png", "Clothes1_$20.png",
"Clothes2_$30.png", "Jeans_$50.png", "Keyboard_$20.png", "AmazonEcho.png",
"play.png", "despacito.png", "PC1_$350.png", "jojo.png", "Tent_$100.png"];

var prodPrice = [10, 5, 20, 100, 50, 20, 130, 250, 999, 350, 30, 100];

// Inactivity to alert User
var inactiveTime = 0

/*******************************************************************************
********************** Store Object and related functions **********************
*******************************************************************************/
var Store = function(initialStock) {
    this.stock = initialStock;
    this.cart = [];
}

// Adds an item to the shopping cart
Store.prototype.addItemToCart = function(itemName) {
    console.log("Add Item to Cart");

    // Check if itemName is in labels
    if (prodLabel.indexOf(itemName) != -1) {
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

    // Reset Inactivity
    resetInactivity();
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

    // Reset Inactivity
    resetInactivity();
}

// Shows the cart to the user
function showCart(cart) {
    console.log("Show Cart to User");
    var userCart = "";

    for (var key in cart) {
        userCart += key + " : ";
        userCart += cart[key];
        userCart += "\n";
    }

    alert(userCart);

    // Reset Inactivity
    resetInactivity();
}

Store.prototype.print = function() {
    console.log("Send Help");
}

// Products catalogue object
var products = [];

// Initializing products
initProd();

// Store object
var store = new Store(products);

/*******************************************************************************
******************************** Misc Functions ********************************
*******************************************************************************/
// Call incInactivity and checkInactivity every second
window.setInterval(incInactivity, 1000);
window.setInterval(checkInactivity, 1000);

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

// Increments inactiveTime every second
function incInactivity() {
    inactiveTime++;
}

// Resets inactiveTime
function resetInactivity() {
    inactiveTime = 0;
}

// Function to check the timeout
function checkInactivity() {
    if (inactiveTime >= 30) {
        // Checking if the User is still active
        // using Alert
        alert("Hey there! Are you still planning to buy something?");
        resetInactivity();

        // Using confirm
        // if (confirm("Hey there! Are you still planning to buy something?")) {
        //     resetInactivity();
        // }
    }
}
