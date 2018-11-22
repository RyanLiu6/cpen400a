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
var classUrl = "http://localhost:3000";

// Error codes
var ERR_CODES = [500, 503];

var globalTimeout = 3;

var displayed = [];

/*******************************************************************************
********************** Store Object and related functions **********************
*******************************************************************************/
var Store = function(serverUrl) {
    this.serverUrl = serverUrl;
    this.cart = {};
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
            // If there are changes in price and quantity
            // Print the changes
            var alertMsg = "";

            for (var key in delta) {
                if (PRODUCT_PRICE in delta[key]) {
                    var curPrice = _this.stock[key][PRODUCT_PRICE];
                    var pastPrice = curPrice - delta[key][PRODUCT_PRICE];

                    var priceChangeMsg = "Price of " + key + " changed from $" + pastPrice + " to $" + curPrice + "\n";
                    alertMsg += priceChangeMsg;
                }

                if (PRODUCT_QUANTITY in delta[key]) {
                    // Need to take into account quantity of items added to cart
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

            // TODO: ACTUAL CHECKOUT HERE

            var order = {};

            var clientId = genUuid();
            order["client_id"] = clientId; // TODO: GENERATE SOMETHING RANDOM HERE
            order["cart"] = _this.cart;
            order["total"] = totalPrice;

            var onSuccessCallback = function (response) {
                alert("Order has been placed!");
                _this.cart = {};
                store.onUpdate();
            };

            var onErrorCallback = function (error) {
                alert("Server returned error: " + error);
            };

            var postUrl = "/checkout"

            ajaxPost(postUrl,
                        order,
                        onSuccessCallback,
                        onErrorCallback);
        }

        if (onFinish != undefined) {
            onFinish(delta);
        }
    });
}

function genUuid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
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
store.syncWithServer(function(delta) {
    var i = 0;
    for (var key in delta) {
        displayed[i++] = key;
    }

    renderProductList(productView, store);
});

store.onUpdate = function(itemName) {
    if (itemName == undefined) {
        var productListView = document.getElementById("productView");
        renderProductList(productListView, store);
    }
    else {
        var productView = document.getElementById("product-" + itemName);
        renderProduct(productView, this, itemName);
    }

    var modalContainer = document.getElementById("modal-content");
    renderCart(modalContainer, this);

    var menuView = document.getElementById("menuView");
    renderMenu(menuView, this);
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

function ajaxPost(url, data, onSuccess, onError) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);

    xhr.onloadend = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                var responseJson = JSON.parse(xhr.responseText);
                onSuccess(responseJson);
            }
            else {
                onError(xhr.status);
            }
        }
    }

    xhr.timeout = 1000;
    xhr.ontimeout = function (e) {
        onError(e);
    }

    xhr.setRequestHeader('Content-type', 'application/json;charset=UTF-8');

    var payload = JSON.stringify(data);
    xhr.send(payload);
}

function calculateDelta(before, after, cart) {
    delta = {};

    for (var item in after) {
        // Check if item exists in before
        if (item in before) {
            delta[item] = {};

            // Iterate through all the associated keys for an item
            for (var key in after[item]) {
                // Only operate on price and qunatity keys
                if(key == PRODUCT_PRICE) {
                    if (before[item][key] != after[item][key]) {
                        delta[item][key] = after[item][key] - before[item][key];
                    }
                }

                if(key == PRODUCT_QUANTITY) {
                    // Need to take into account the amount in the cart right now
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

            // Delete the item from delta if there are no changes
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
                // If there is enough available stock for the cart
                // Then just subtract amount in cart from the stock
                newStock[key][PRODUCT_QUANTITY] -= curCart[key];
            }
            else {
                // If there is less stock now than what was in the cart before
                // Decrease the amount in the cart to that of the available stock
                curCart[key] = newStock[key][PRODUCT_QUANTITY];
                newStock[key][PRODUCT_QUANTITY] = 0;

                if (curCart[key] == 0) {
                    delete curCart[key];
                }
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
    for(var key in displayed) {
        // create a new li element and use it as container for
        // the product to be rendered in
        var currProduct = displayed[key]
        var productDom = document.createElement("li");
        productDom.id = "product-" + currProduct;
        productDom.className = "product";

        renderProduct(productDom, storeInstance, currProduct);

        productList.appendChild(productDom);
    }

    // if the current container already contains any other elements
    // clear the container
    if (container.firstChild != undefined) {
        cleanContainer(container);
    }

    container.appendChild(productList);
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
***************************** Provided Functions *******************************
*******************************************************************************/
Store.prototype.queryProducts = function(query, callback){
    var self = this;
	var queryString = Object.keys(query).reduce(function(acc, key){
			return acc + (query[key] ? ((acc ? '&':'') + key + '=' + query[key]) : '');
		}, '');
	ajaxGet(this.serverUrl+"/products?"+queryString,
		function(products){
            console.log(products);
			Object.keys(products)
				.forEach(function(itemName){
					var rem = products[itemName].quantity - (self.cart[itemName] || 0);
					if (rem >= 0){
						self.stock[itemName].quantity = rem;
					}
					else {
						self.stock[itemName].quantity = 0;
						self.cart[itemName] = products[itemName].quantity;
						if (self.cart[itemName] === 0) delete self.cart[itemName];
					}

					self.stock[itemName] = Object.assign(self.stock[itemName], {
						price: products[itemName].price,
						label: products[itemName].label,
						imageUrl: products[itemName].imageUrl
					});
				});
			self.onUpdate();
			callback(null, products);
		},
		function(error){
			callback(error);
		}
	)
}

function renderMenu(container, storeInstance){
	while (container.lastChild) container.removeChild(container.lastChild);
	if (!container._filters) {
		container._filters = {
			minPrice: null,
			maxPrice: null,
			category: ''
		};
		container._refresh = function(){
			storeInstance.queryProducts(container._filters, function(err, products){
					if (err){
						alert('Error occurred trying to query products');
						console.log(err);
					}
					else {
						displayed = Object.keys(products);
						renderProductList(document.getElementById('productView'), storeInstance);
					}
				});
		}
	}

	var box = document.createElement('div'); container.appendChild(box);
		box.id = 'price-filter';
		var input = document.createElement('input'); box.appendChild(input);
			input.type = 'number';
			input.value = container._filters.minPrice;
			input.min = 0;
			input.placeholder = 'Min Price';
			input.addEventListener('blur', function(event){
				container._filters.minPrice = event.target.value;
				container._refresh();
			});

		input = document.createElement('input'); box.appendChild(input);
			input.type = 'number';
			input.value = container._filters.maxPrice;
			input.min = 0;
			input.placeholder = 'Max Price';
			input.addEventListener('blur', function(event){
				container._filters.maxPrice = event.target.value;
				container._refresh();
			});

	var list = document.createElement('ul'); container.appendChild(list);
		list.id = 'menu';
        list.style = "list-style-type:none"
		var listItem = document.createElement('li'); list.appendChild(listItem);
			listItem.className = 'menuItem' + (container._filters.category === '' ? '-active': '');
            var fontItem = document.createElement("font");
            fontItem.appendChild(document.createTextNode('All Items'));
			listItem.appendChild(fontItem);
			listItem.addEventListener('click', function(event){
				container._filters.category = '';
				container._refresh()
			});
	var CATEGORIES = [ 'Clothing', 'Technology', 'Office', 'Outdoor' ];
	for (var i in CATEGORIES){
		var listItem = document.createElement('li'); list.appendChild(listItem);
			listItem.className = 'menuItem' + (container._filters.category === CATEGORIES[i] ? '-active': '');
            var fontItem = document.createElement("font");
            fontItem.appendChild(document.createTextNode(CATEGORIES[i]));
            listItem.appendChild(fontItem);
			listItem.addEventListener('click', (function(i){
				return function(event){
					container._filters.category = CATEGORIES[i];
					container._refresh();
				}
			})(i));
	}
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
