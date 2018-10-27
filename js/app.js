// Global Variables for access
var NUM_PRODUCTS = 12;
var PRODUCT_LABEL = "label";
var PRODUCT_IMGURL = "imageUrl";
var PRODUCT_PRICE = "price";
var PRODUCT_QUANTITY = "quantity";
var IMAGE_BASE_URL = "images/";
var PRODUCT_LIST = "productList";

// Product Information - could be replaced with document.getElementBy ...
var prodId = ["Box1", "Box2", "Clothes1", "Clothes2", "KeyboardCombo", "Mice",
"PC1", "PC2", "PC3", "Tent", "Jeans", "Keyboard"];

var prodLabel = ["Box 1", "Box 2", "Clothes 1", "Clothes 2", "Keyboard Combo", "Mice",
"PC1", "PC2", "PC3", "Tent", "Jeans", "Keyboard"];

var prodURL = ["Box1_$10.png", "Box2_$5.png", "Clothes1_$20.png",
"Clothes2_$30.png", "KeyboardCombo_$40.png", "Mice_$20.png", "PC1_$350.png",
"PC2_$400.png", "PC3_$300.png", "Tent_$100.png", "Jeans_$50.png", "Keyboard_$20.png"];

var prodPrice = [10, 5, 20, 100, 40, 20, 350, 400, 300, 100, 50, 20];

// Inactivity to alert User
var inactiveTime = 0;

// Dynamic generation
var productClasses = ["productImg", "productName", "btn-add", "btn-remove"];

// First creation of buttons
var domsCreated = false;
/*******************************************************************************
********************** Store Object and related functions **********************
*******************************************************************************/
var Store = function(initialStock) {
    this.stock = initialStock;
    this.cart = [];
    this.onUpdate = null;
}

// Adds an item to the shopping cart
Store.prototype.addItemToCart = function(itemName) {
    console.log("Add Item to Cart");

    // Check if itemName is in labels
    if (this.stock[itemName] != undefined) {
        // Check if theres any stock left
        if (this.stock[itemName][PRODUCT_QUANTITY] >= 1) {
            // Since there is stock available, add to cart
            if (itemName in this.cart) {
                this.cart[itemName]++;
            } else {
                this.cart[itemName] = 1;
            }

            // Decrement from stock
            this.stock[itemName][PRODUCT_QUANTITY]--;
        } else {
            var err = "Item " + itemName + " is out of stock. Please select another item.";
            alert(err);
        }
    }

    // Updating view
    this.onUpdate(itemName);

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

    // Updating view
    this.onUpdate(itemName);

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

// Products catalogue object
var products = [];

// Initializing products
initProd();

// Store object
var store = new Store(products);
store.onUpdate = function(itemName) {
    console.log(document.getElementById("product-" + itemName));
    renderProduct(document.getElementById("product-" + itemName), this, itemName);
}

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

        products[prodId[i]] = prod;
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
    if (inactiveTime >= 1800) {
        // Checking if the User is still active
        // using Alert
        alert("Hey there! Are you still planning to buy something?");
        resetInactivity();
    }
}

function sendHelp() {
    console.log("send help");
}

/*******************************************************************************
******************************* Render Functions *******************************
*******************************************************************************/
// container: DOM element -> productView div
// storeInstance: instance of Store
function renderProductList(container, storeInstance) {
    // Check if productList exists
    var createdList = false;
    var productList = document.getElementById(PRODUCT_LIST);
    if (productList == null) {
        productList = document.createElement("ul");
        productList.id = PRODUCT_LIST;
        productList.style.listStyle = "none";
        createdList = true;
    }

    // Set the contents of container
    for (var i = 0; i < NUM_PRODUCTS; i++) {
        var productDom = document.createElement("li");
        productDom.id = "product-" + prodId[i];
        productDom.className = "product";

        renderProduct(productDom, storeInstance, prodId[i]);

        productList.appendChild(productDom);
    }

    domsCreated = true;

    if (createdList) {
        container.appendChild(productList);
    } else {
        container.replaceChild(productList, document.getElementById(PRODUCT_LIST));
    }

    console.log(productList);
}

// container: DOM element -> list element w/ id="product-<itemName>"
// storeInstance: instance of Store
// itemName: name of a product
function renderProduct(container, storeInstance, itemName) {
    // Check if itemName is in stocks
    var currItem = storeInstance.stock[itemName];
    var stockFlag = false;
    var cartFlag = false;

    if (currItem != undefined) {
        // Create prodImg dom
        var newImg = createImageDom(itemName, currItem);

        // Create name dom
        var newName = createNameDom(itemName, currItem);

        // Create buttons dom
        btnArr = createButtonsDom(itemName, storeInstance, currItem);

        // If created, update em
        // Else, append to container

        var img = container.getElementsByClassName("productImg");
        if (img.length > 0) {
            // Product Image
            var currImg = document.getElementById("prodImg-" + itemName);
            container.replaceChild(newImg, currImg);

            var currName = document.getElementById("displayName-" + itemName);
            container.replaceChild(newName, currName);

            var currAdd = document.getElementById("btn-add-" + itemName);
            if (currAdd == null) {
                container.appendChild(btnArr[0]);
            } else {
                if (btnArr[1]) {
                    container.replaceChild(btnArr[0], currAdd);
                } else {
                    container.removeChild(currAdd);
                }
            }

            var currRemove = document.getElementById("btn-remove-" + itemName);
            if (currRemove == null) {
                container.appendChild(btnArr[2]);
            } else {
                if (btnArr[3]) {
                    container.replaceChild(btnArr[2], currRemove);
                } else {
                    container.removeChild(currRemove);
                }
            }
        } else {
            container.appendChild(newImg);
            container.appendChild(newName);

            if (btnArr[1]) {
                container.appendChild(btnArr[0]);
            }

            if (btnArr[3]) {
                container.appendChild(btnArr[2]);
            }
        }
    }
}

function createImageDom(itemName, currItem) {
    // Creating productImg div dom
    var imgDom = document.createElement("img");
    var priceDom = document.createElement("h2");
    var prodImgDom = document.createElement("div");

    imgDom.src = IMAGE_BASE_URL + currItem[PRODUCT_IMGURL];
    var priceText = document.createElement("span");
    priceText.appendChild(document.createTextNode(currItem[PRODUCT_PRICE].toString()));
    priceDom.appendChild(priceText);

    prodImgDom.className = "productImg";
    prodImgDom.id = "prodImg-" + itemName;
    prodImgDom.appendChild(imgDom);
    prodImgDom.appendChild(priceDom);

    return prodImgDom;
}

function createNameDom(itemName, currItem) {
    // Creating the item name dom
    var nameDom = document.createElement("h2");
    nameDom.appendChild(document.createTextNode(currItem[PRODUCT_LABEL].toString()));
    nameDom.id = "displayName-" + itemName;

    return nameDom;
}

function createButtonsDom(itemName, storeInstance, currItem) {
    var stockFlag = false;
    var cartFlag = false;
    var btnAdd = document.createElement("button");
    var btnRemove = document.createElement("button");

    if (currItem[PRODUCT_QUANTITY] > 0) {
        btnAdd.className = "btn-add";
        btnAdd.id = "btn-add-" + itemName;
        btnAdd.onclick = function () {
            storeInstance.addItemToCart(itemName);
        };
        btnAdd.appendChild(document.createTextNode("Add to Cart"));
        stockFlag = true;
    }

    if (itemName in storeInstance.cart) {
        btnRemove.className = "btn-remove";
        btnRemove.id = "btn-remove-" + itemName;
        btnRemove.onclick = function() {
            storeInstance.removeItemFromCart(itemName);
        };
        btnRemove.appendChild(document.createTextNode("Remove from Cart"));
        cartFlag = true;
    }

    return [btnAdd, stockFlag, btnRemove, cartFlag];
}

// container: DOM element ->
// storeInstance: instance of Store
// function renderCart(container, storeInstance) {
//
// }

/*******************************************************************************
**************************** Cart Render Functions *****************************
*******************************************************************************/
function renderCart(container, storeInstance) {
    var tableDom = document.createElement("table");
    tableDom.id = "cartTable";

    

    for(var curKey in storeInstance.cart) {
        var curQuantity = storeInstance.cart[curKey];
        
    }
}