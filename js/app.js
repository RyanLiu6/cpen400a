// Global Variables for access
var PRODUCT_LABEL = "label";
var PRODUCT_IMGURL = "imageUrl";
var PRODUCT_PRICE = "price";
var PRODUCT_QUANTITY = "quantity";

// Number of tries
var NUM_TRIES = 3;

// Inactivity to alert User
var inactiveTime = 0;

// Class Server URL
var classUrl = "https://cpen400a-bookstore.herokuapp.com";

// Error codes
var ERR_CODES = [500, 503];

var globalTimeout = 3;

/*******************************************************************************
********************** Store Object and related functions **********************
*******************************************************************************/
var Store = function(serverUrl) {
    this.serverUrl = serverUrl;
    this.cart = [];
    this.stock = {};
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

Store.prototype.syncWithServer = function(onSync) {
    var _this = this;

    ajaxGet(
        this.serverUrl + "/products",

        function(response) {
            console.log(response);

            // Calculate delta
            delta = calculateDelta(_this.stock, response, _this.cart);

            updateStock(_this, response);
            _this.onUpdate();

            if (onSync != undefined) {
                onSync(delta);
            }
        },

        function(error) {
            console.log(error);
        }
    );
}

Store.prototype.checkOut = function(onFinish) {
    var _this = this;

    this.syncWithServer(function(delta) {
        console.log("Finished Sync");

        if (Object.keys(delta).length != 0) {
            var alertMsg = "";

            for (var key in delta) {
                if (PRODUCT_PRICE in delta[key]) {
                    var curPrice = _this.stock[key][PRODUCT_PRICE];
                    var pastPrice = curPrice - delta[key][PRODUCT_PRICE];

                    var priceChangeMsg = "Price of " + key + " changed from $" + pastPrice + " to $" + curPrice + "\n";
                    alertMsg += priceChangeMsg;
                }

                if (PRODUCT_QUANTITY in delta[key]) {
                    var cartQuantity;
                    if (key in _this.cart) {
                        cartQuantity = _this.cart[key];
                    }
                    else {
                        cartQuantity = 0;
                    }

                    var curQuantity = _this.stock[key][PRODUCT_QUANTITY] + cartQuantity;
                    var pastQuantity = curQuantity - delta[key][PRODUCT_QUANTITY];

                    var quantityChangeMsg = "Quantity of " + key + " changed from " + pastQuantity + " to " + curQuantity + "\n";
                    alertMsg += quantityChangeMsg;
                }
            }

            alert(alertMsg);
            console.log(delta);

            var modalContainer = document.getElementById("modal-content");
            renderCart(modalContainer, _this);
        }
        else {
            var totalPrice = 0;
            for (var curKey in _this.cart) {
                var curQuantity = _this.cart[curKey];

                // keep record of the total price
                totalPrice += curQuantity * _this.stock[curKey][PRODUCT_PRICE];
            }
            alert("Total price is: " + (totalPrice).toString());
        }

        if (onFinish != undefined) {
            onFinish(delta);
        }
    });
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

// Store object
var store = new Store(classUrl);
store.syncWithServer();

store.onUpdate = function(itemName) {
    if (itemName == undefined) {
        var productView = document.getElementById("productView");
        renderProductList(productView, store);
    }
    else {
        renderProduct(document.getElementById("product-" + itemName), this, itemName);

        var modalContainer = document.getElementById("modal-content");
        renderCart(modalContainer, this);
    }
}

/*******************************************************************************
******************************** AJAXs Functions ********************************
*******************************************************************************/
function ajaxGet(url, onSuccess, onError) {
    ajaxHelper(url, onSuccess, onError, NUM_TRIES);
}

function ajaxHelper(url, onSuccess, onError, iteration) {
    if (iteration == 0) {
        onError("Attempted too many times");
        return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    // Both success and Error -> must check status to label response
    xhr.onloadend = function() {
        if (ERR_CODES.includes(xhr.status)) {
            recurse(iteration);
        }
        else {
            onSuccess(JSON.parse(xhr.response));
        }
    }

    // Timeout
    xhr.timeout = 1000;
    xhr.ontimeout = function (e) {
        recurse(iteration);
    }

    // Recursive function for purposes of checking number of tries
    var recurse = function(currIteration) {
        console.log("Iteration: " + (-1 * (currIteration - NUM_TRIES).toString()));
        ajaxHelper(url, onSuccess, onError, currIteration - 1);
    }

    xhr.send();
}

function calculateDelta(before, after, cart) {
    delta = {};

    for (var item in after) {
        // Check if item exists in before
        if (item in before) {
            delta[item] = {};
            for (var key in after[item]) {
                if(key == PRODUCT_PRICE) {
                    if (before[item][key] != after[item][key]) {
                        delta[item][key] = after[item][key] - before[item][key];
                    }
                }

                if(key == PRODUCT_QUANTITY) {
                    var curQuantity = before[item][key];

                    if (item in cart) {
                        console.log(key);
                        curQuantity += cart[item];
                    }

                    if (curQuantity != after[item][key]) {
                        delta[item][key] = after[item][key] - curQuantity;
                    }
                }
            }

            if (Object.keys(delta[item]).length == 0) {
                delete delta[item];
            }
        }
        else {
            delta[item] = item;
        }
    }

    return delta;
}

function updateStock(store, newStock) {
    var curCart = store.cart;
    for (var key in curCart) {
        if (key in newStock) {
            if (newStock[key][PRODUCT_QUANTITY] >= curCart[key]) {
                newStock[key][PRODUCT_QUANTITY] -= curCart[key];
            }
            else {
                curCart[key] = newStock[key][PRODUCT_QUANTITY];
                newStock[key][PRODUCT_QUANTITY] = 0;
            }
        }
        else {
            curCart[key] = 0;
        }
    }

    store.stock = newStock;
}

/*******************************************************************************
******************************** Misc Functions ********************************
*******************************************************************************/
// Call incInactivity and checkInactivity every second
window.setInterval(incInactivity, 1000);
window.setInterval(checkInactivity, 1000);

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
************************** Product Render Functions ****************************
*******************************************************************************/
// container: DOM element -> productView div
// storeInstance: instance of Store
function renderProductList(container, storeInstance) {
    // create a new ul element
    var productList = document.createElement("ul");
    productList.style.listStyle = "none";

    // iterate through all avaialble products in the store
    var stock = storeInstance.stock;
    for(var key in stock) {
        // create a new li element and use it as container for
        // the product to be rendered in
        var productDom = document.createElement("li");
        productDom.id = "product-" + key;
        productDom.className = "product";

        renderProduct(productDom, storeInstance, key);

        productList.appendChild(productDom);
    }

    // if the current container already contains any other elements
    // clear the container
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
    // get the item and check if it exists
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

        // if the current container already contains any other elements
        // clear the container
        if (container.firstChild != undefined) {
            cleanContainer(container);
        }

        // append all the image and item name
        container.appendChild(newImg);
        container.appendChild(newName);

        // append button if it is available/created
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

    imgDom.src = currItem[PRODUCT_IMGURL];
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

    // only create add button if the item is still in stock
    if (currItem[PRODUCT_QUANTITY] > 0) {
        btnAdd = document.createElement("button");
        btnAdd.className = "btn-add";
        btnAdd.id = "btn-add-" + itemName;
        btnAdd.onclick = function () {
            storeInstance.addItemToCart(itemName);
        };
        btnAdd.appendChild(document.createTextNode("Add to Cart"));
    }

    // only create remove button if 1 or more of the item has been added to cart
    if (itemName in storeInstance.cart && storeInstance.cart[itemName] > 0) {
        btnRemove = document.createElement("button");
        btnRemove.className = "btn-remove";
        btnRemove.id = "btn-remove-" + itemName;
        btnRemove.onclick = function() {
            storeInstance.removeItemFromCart(itemName);
        };
        btnRemove.appendChild(document.createTextNode("Remove from Cart"));
    }

    // return both buttons in array
    return [btnAdd, btnRemove];
}

/*******************************************************************************
**************************** Cart Render Functions *****************************
*******************************************************************************/
function renderCart(container, storeInstance) {
    // create new table element
    var tableDom = document.createElement("table");
    tableDom.id = "cartTable";

    // create and append table headers
    var header = createTableHeader();
    tableDom.appendChild(header);

    var totalPrice = 0;

    if (storeInstance != undefined) {
        // iterate through all items in the cart and create table entry based on it
        for (var curKey in storeInstance.cart) {
            var curLabel = storeInstance.stock[curKey][PRODUCT_LABEL];
            var curQuantity = storeInstance.cart[curKey];

            var curItemEntry = createTableEntry(curKey, curLabel, curQuantity, storeInstance);
            tableDom.appendChild(curItemEntry);

            // keep record of the total price
            totalPrice += curQuantity * storeInstance.stock[curKey][PRODUCT_PRICE];
        }
    }

    // render the total price as a table entry
    var totalEntry = createTotalEntry(totalPrice);
    tableDom.appendChild(totalEntry);

    if (container.firstChild != undefined) {
        cleanContainer(container);
    }

    container.appendChild(tableDom);

    var checkOutBtn = document.createElement("button");
    checkOutBtn.id = "btn-check-out";
    checkOutBtn.appendChild(document.createTextNode("Check Out"));
    checkOutBtn.onclick = function() {
        checkOutBtn.disabled = true;

        console.log("Clicked Checkout");

        var checkOutCallback = function(delta) {
            checkOutBtn.disabled = false;

            if (Object.keys(delta).length != 0) {
                console.log(delta);
            }
        };

        store.checkOut(checkOutCallback)
    };
    container.appendChild(checkOutBtn);
}

function cleanContainer(container) {
    // cleanup by removeing all children from container
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

    // create +/- buttons and attach corresponding event handlers
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

/*******************************************************************************
******************************* Event Handlers *********************************
*******************************************************************************/
document.addEventListener('keydown', function(event) {
    // respond to esc (key code 27)
    if(event.keyCode === 27) {
        hideCart();
    }
});
