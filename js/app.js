// Global Variables for access
var NUM_PRODUCTS = 12;
var PRODUCT_LABEL = "label";
var PRODUCT_IMGURL = "imageUrl";
var PRODUCT_PRICE = "price";
var PRODUCT_QUANTITY = "quantity";
var IMAGE_BASE_URL = "images/";
var PRODUCT_LIST = "productList";

// Product Information - could be replaced with document.getElementBy ...
var prodId = ["Box1", "Box2", "Clothes1", "Clothes2", "Jeans", "Keyboard", "KeyboardCombo", "Mice",
"PC1", "PC2", "PC3", "Tent"];

var prodLabel = ["Box 1", "Box 2", "Clothes 1", "Clothes 2", "Jeans", "Keyboard", "Keyboard Combo", "Mice",
"PC1", "PC2", "PC3", "Tent"];

var prodURL = ["Box1_$10.png", "Box2_$5.png", "Clothes1_$20.png",
"Clothes2_$30.png", "Jeans_$50.png", "Keyboard_$20.png", "KeyboardCombo_$40.png", "Mice_$20.png", "PC1_$350.png",
"PC2_$400.png", "PC3_$300.png", "Tent_$100.png"];

var prodPrice = [10, 5, 20, 100, 50, 20, 40, 20, 350, 400, 300, 100];

// Inactivity to alert User
var inactiveTime = 0;

// Dynamic generation
var productClasses = ["productImg", "productName", "btn-add", "btn-remove"];

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

            // Updating view
            this.onUpdate(itemName);
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

    // Updating view
    this.onUpdate(itemName);

    // Reset Inactivity
    resetInactivity();
}

// Shows the cart to the user
function showCart(store) {
    console.log("Show Cart to User");

    var modalContent = document.getElementById("modal-content");
    renderCart(modalContent, store);

    document.getElementById("modal").style.visibility = "visible";

    // Reset Inactivity
    resetInactivity();
}

function hideCart() {
    document.getElementById("modal").style.visibility = "hidden";
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

    var modalContainer = document.getElementById("modal-content");
    renderCart(modalContainer, this);
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
    var productList = document.createElement("ul");
    productList.id = PRODUCT_LIST;
    productList.style.listStyle = "none";

    var stock = storeInstance.stock;
    for(var key in stock) {
        var productDom = document.createElement("li");
        productDom.id = "product-" + key;
        productDom.className = "product";

        renderProduct(productDom, storeInstance, key);

        productList.appendChild(productDom);
    }

    if (container.firstChild != undefined) { 
        cleanContainer(container);
    } 

    container.appendChild(productList);

    console.log(productList);
}

// container: DOM element -> list element w/ id="product-<itemName>"
// storeInstance: instance of Store
// itemName: name of a product
function renderProduct(container, storeInstance, itemName) {
    // Check if itemName is in stocks
    var currItem = storeInstance.stock[itemName];

    if (currItem != undefined) {
        // Create prodImg dom
        var newImg = createImageDom(itemName, currItem);

        // Create name dom
        var newName = createNameDom(itemName, currItem);

        // Create buttons dom
        var btnArr = createButtonsDom(itemName, storeInstance, currItem);
        var newAddBtn = btnArr[0];
        var newRemoveBtn = btnArr[1];

        // If created, update em
        // Else, append to container

        if (container.firstChild != undefined) {
            cleanContainer(container);
        } 

        container.appendChild(newImg);
        container.appendChild(newName);

        if (newAddBtn != null) {
            container.appendChild(newAddBtn);
        }

        if (newRemoveBtn != null) {
            container.appendChild(newRemoveBtn);
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
    priceText.appendChild(document.createTextNode("$" + currItem[PRODUCT_PRICE].toString()));
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
    var btnAdd = null;
    var btnRemove = null;

    if (currItem[PRODUCT_QUANTITY] > 0) {
        btnAdd = document.createElement("button");
        btnAdd.className = "btn-add";
        btnAdd.id = "btn-add-" + itemName;
        btnAdd.onclick = function () {
            storeInstance.addItemToCart(itemName);
        };
        btnAdd.appendChild(document.createTextNode("Add to Cart"));
    }

    if (itemName in storeInstance.cart && storeInstance.cart[itemName] > 0) {
        btnRemove = document.createElement("button");
        btnRemove.className = "btn-remove";
        btnRemove.id = "btn-remove-" + itemName;
        btnRemove.onclick = function() {
            storeInstance.removeItemFromCart(itemName);
        };
        btnRemove.appendChild(document.createTextNode("Remove from Cart"));
    }

    return [btnAdd, btnRemove];
}

/*******************************************************************************
**************************** Cart Render Functions *****************************
*******************************************************************************/
function renderCart(container, storeInstance) {
    var tableDom = document.createElement("table");
    tableDom.id = "cartTable";

    var header = createTableHeader();
    tableDom.appendChild(header);

    var totalPrice = 0;

    if (storeInstance != undefined) {
        for (var curKey in storeInstance.cart) {
            var curLabel = storeInstance.stock[curKey][PRODUCT_LABEL];
            var curQuantity = storeInstance.cart[curKey];
            
            var curItemEntry = createTableEntry(curKey, curLabel, curQuantity, storeInstance);
            tableDom.appendChild(curItemEntry);

            totalPrice += curQuantity * storeInstance.stock[curKey][PRODUCT_PRICE];
        }
    }

    var totalEntry = createTotalEntry(totalPrice);
    tableDom.appendChild(totalEntry);

    if (container.firstChild != undefined) {
        cleanContainer(container);
    }

    container.appendChild(tableDom);
}

function cleanContainer(container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

function createTableHeader() {
    var header = document.createElement("tr");
    header.id = "tableHeader";
    
    var headerName = document.createElement("th");
    headerName.appendChild(document.createTextNode("Item Name"));

    var headerQuantity = document.createElement("th");
    headerQuantity.appendChild(document.createTextNode("Quantity"));

    header.appendChild(headerName);
    header.appendChild(headerQuantity);

    return header;
}

function createTableEntry(itemName, itemLabel, quantity, storeInstance) {
    var entry = document.createElement("tr");
    entry.id = "tableEntry";

    var entryName = document.createElement("td");
    entryName.append(document.createTextNode(itemLabel));

    var entryQuantity = document.createElement("td");

    var increaseBtn = document.createElement("button");
    increaseBtn.className = "cartTableAdd";
    increaseBtn.onclick = function() {
        storeInstance.addItemToCart(itemName);
    };
    increaseBtn.appendChild(document.createTextNode("+"));
    entryQuantity.appendChild(increaseBtn);

    entryQuantity.appendChild(document.createTextNode(quantity));

    var decrease = document.createElement("button");
    decrease.className = "cartTableRemove";
    decrease.onclick = function() {
        storeInstance.removeItemFromCart(itemName);
    };
    decrease.appendChild(document.createTextNode("-"));
    entryQuantity.appendChild(decrease);

    entry.appendChild(entryName);
    entry.appendChild(entryQuantity);

    return entry;
}

function createTotalEntry(total) {
    var totalEntry = document.createElement("tr");
    totalEntry.id = "totalPrice";
    
    var totalTag = document.createElement("th");
    totalTag.appendChild(document.createTextNode("Total"));

    var totalPrice = document.createElement("th");
    totalPrice.appendChild(document.createTextNode("$" + total));

    totalEntry.appendChild(totalTag);
    totalEntry.appendChild(totalPrice);

    return totalEntry;
}

document.addEventListener('keydown', function(event) {
    if(event.keyCode === 27) {
        hideCart();
    }
})
