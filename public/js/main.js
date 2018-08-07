// Editing the Number prototype causes problems when calling the function in byProduct / bySku
// Instead, use the regular function defined below

/*Number.prototype.formatMoney = function(c, d, t){
    var n = this, 
        c = isNaN(c = Math.abs(c)) ? 2 : c, 
        d = d == undefined ? "." : d, 
        t = t == undefined ? "," : t, 
        s = n < 0 ? "-" : "", 
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
        j = (j = i.length) > 3 ? j % 3 : 0;
       return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 };*/

function formatMoneys (nThis, c, d, t){
    var n = nThis, 
        c = isNaN(c = Math.abs(c)) ? 2 : c, 
        d = d == undefined ? "." : d, 
        t = t == undefined ? "," : t, 
        s = n < 0 ? "-" : "", 
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
        j = (j = i.length) > 3 ? j % 3 : 0;
       return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 };

var numBrandsGot = 0;
var brands = ["aveda", "aerin", "clinique", "m-a-c", "becca", "bumble", "bobbi brown", "estee lauder", "origins", "smashbox", "la mer", "lab series", "darphin", "adf", "tom ford", "jo malone", "frederic malle"];
var items = [];
var isFirstTime = true;

// List.js for 1) Products, 2) Purescription

// 1) Products
var optionsAllProducts = {
    valueNames: ['brand', 'productImage','prodRgnName','shadeOrSize','formattedPrice','sale','formattedSale','qty','id'],
    listClass: 'list',
    searchClass: 'search',
    page: 1500,
    item: '<li class="products item"> <aside class="row"> <span class="id"></span> <span class="brand"></span> <span class="isSelected"></span> <div class="productImage"></div><div class="col-xs-8"> <h5><span class="formattedSale"></span> <span class="formattedPrice"></span></h5> <h2 class="prodRgnName"></h2> <h4 class="shadeOrSize"></h4> <div class="qty-container"> <button class="minus">-</button><span class="qty"></span> <button class="plus">+</button> </div></div><div class="col-xs-4"> <button class="addToWishlist"><span class="glyphicon glyphicon-plus-sign"> </span><span class="glyphicon glyphicon-heart"> </span> </button> </div></aside></li>'
};
var allProducts = new List('all-products', optionsAllProducts);

// 2) Wishlist / Shopping Cart
var optionsPS = {
    valueNames: ['brand', 'productImage','prodRgnName','shadeOrSize','formattedPrice','sale','formattedSale','qty','id'],
    listClass: 'listPS',
    searchClass: 'searchPS',
    page: 600,
    item: '<li class="wishlist item"> <aside class="row"> <span class="id"></span> <span class="brand"></span> <div class="col-xs-3 productImage"></div><div class="col-xs-7"> <h2 class="prodRgnName"></h2> <h4 class="shadeOrSize"></h4> <h5><span class="formattedPrice"></span> Sale: <span class="formattedSale"></span></h5> <div class="qty-container"><button class="minus">-</button><span class="qty"></span><button class="plus">+</button></div> </div><div class="col-xs-2"> <button class="addToWishlist"><span class="glyphicon glyphicon-minus-sign"> </span></button> </div></aside></li>'
};
var ps = new List('wishlist', optionsPS);


// Instatiate Purescription array (from List "ps" above)
var arrayPS = [];


// Quick nav functions

function showBooths() {
    $('html, body').animate({ scrollTop: 0 }, 150,"swing");
    $('#title').text('Welcome to Sale-a-Bration!');
    $('article#booths').fadeTo(200, 1);
    $('article#all-products').hide();
    $('article#wishlist').hide();
    $('nav').hide();
    $('header .back').hide();
}
function showProducts(brand) {
    allProducts.search(brand);
    
    $('html, body').animate({ scrollTop: 0 }, 150,"swing");
    $('#title').text(brand.replace(/-/g,''));
    $('article#booths').hide();
    $('article#all-products').fadeTo(200, 1);
    $('article#wishlist').hide();
    $('nav').hide();
    $('header .back').show();
}
function showWishlist() {
    $('#title').text('Wishlist');
    $('article#booths').hide();
    $('article#all-products').hide();
    $('article#wishlist').fadeTo(200, 1);
    $('nav').fadeTo(200, 1);
    $('header .back').hide();
}

// Filter and helper functions

function filter(brand){
    
    if (brand === '') {
        $('#showWhichBooth').text('All');
    } else {
        $('#showWhichBooth').text(brand);
    }
    
    ps.search(brand);

    if (ps.search(brand).length === 0 && brand === ' '){
        $('#wishlist-brand').hide();
    } else if (ps.search(brand).length === 0) {
        $('#wishlist-brand').show();
    } else {
        $('#wishlist-brand').hide();
    }
    /*if (brand !== ''){
        $('#save-wishlist').hide();
    }*/
    
}

function checkIfWishlistEmpty() {
    if (ps.size() === 0) {
        $('#wishlist-empty').slideToggle();
        $('nav').hide();
    } else {
        $('#wishlist-empty').hide();
    }
}

function saveWishlistToDb() {
    // items = JSON.stringify(ps.items);
    
    dbwish.transaction(function (tx) {                
        tx.executeSql('SELECT * FROM wishlist', [], function (tx, results) {
            console.log("wishlist items saved: " + results.rows.length);
        })
    });
    
    items = [];
    // Save items to an array
    for (j = 0; j < ps.items.length; j++) {

        // console.log(ps.items[j].values().prodRgnName);
        // console.log(ps.items[0]._values);

        items[j] = ps.items[j].values();
        // console.log("saving: ");
    }
    

    // Add items to localStorage
    dbwish.transaction(function (tx) {
        tx.executeSql('UPDATE wishlist SET items=? WHERE id=1;', [JSON.stringify(items)], function(tx, res){}, function(tx,err){});
    });
    
    $('#save-wishlist').slideToggle();
    $('#saved').show();
}
    

function addToWishlistFromDb() {
    
    dbwish.transaction(function (tx) {                
        tx.executeSql('SELECT * FROM wishlist', [], function (tx, results) {
            
            // put db items into items array
            var itemsParsed = JSON.parse(results.rows.item(0).items);
            items = itemsParsed;
            
            // loop through items array, add each to ps list
            items.forEach(function(currVal,index,arr){
                console.log(currVal.brand);
                ps.add([ 
                    { brand: currVal.brand, productImage: currVal.productImage, prodRgnName: currVal.prodRgnName, shadeOrSize: currVal.shadeOrSize, formattedPrice: currVal.formattedPrice, sale: currVal.sale, formattedSale: currVal.formattedSale, qty: currVal.qty, id: currVal.id }
                ]);
            });
            
            console.log('parsed wishlist items length: ' + itemsParsed.length);
            
            checkIfWishlistEmpty();
            updateCounter();
            
            
        }, function(tx,err){ console.log('errors: ' + err) });
    });

}

$('nav li').on('click', function(){
    $('nav li').css({'background-color':'#000', 'color': '#fff'});
    $(this).css({'background-color':'#fff', 'color': '#000'});
    $('nav ul').slideToggle();
})

// The fun stuff begins

window.onload=function(){
    

    addToWishlistFromDb();
    
    /* ****** GET PRODUCTS WUZ HERE ****** */
    
    // This was code to test saving to DACS
    
    var userTag = ''; // 1939467-83df1b1fccf87d473332fe194bd2c05dcdbe97ef6be09b4e869cbb2582a6d8bb
    
    ps.on('updated', function(){
        
        updateCounter();
        $('#saved').hide();
        $('#save-wishlist').show();
        
        // saveWishlistToDb();
        
        // *** Testing saving to DACS ***
        // ******************************
        // $('#array').html(ps.items[0].elm);
        // var email = 'jlestee@yahoo.com';
        // var firstname = 'Jason';
        // var lastname = 'Lalor';
        // var attrArray = ['WISHLIST'];
        
        // var userWishlist = ps.items[0].elm.outerHTML;
        // var userWishlist;
        // console.log(btoa(userWishlist));
        
        // var userWishlist = "wishlist";
        
        // var dacsPostURL = "https://ncsa.dacs.esteeonline.com/rpc/response.tmpl?METHOD=dacs.set&APP_ID=177&EMAIL_ADDRESS=" + email + "&FIRST_NAME=" + firstname + "&LAST_NAME=" + lastname + "&EMAIL_PROMOTIONS=0&LAST_SOURCE=Sale-a-bration&WISHLIST=" + window.btoa(userWishlist);
        
        // console.log( window.btoa(userWishlist) );
        
        
        
        /*$.ajax({
            type: "POST",
            url: dacsPostURL,
            // jsonpCallback: 'sorryCallback',
            dataType: 'jsonp',
            success: function(r){
                userTag = r[0].result.data.tag;
                console.log(userTag);
                var dacsGetURL = "https://ncsa.dacs.esteeonline.com/rpc/response.tmpl?METHOD=dacs.get&APP_ID=177&TAG=" + userTag;
                
                $.ajax({
                    type: "POST",
                    url: dacsGetURL,
                    // jsonpCallback: 'sorryCallback',
                    dataType: 'jsonp',
                    success: function(user){
                        var dacsRes = user[0].result.value.ATTRIBUTE_VALUE;
                        var res = dacsRes.replace(/ /g, "+");
                        var resHTML = atob(res);
                        
                        // console.log('successful get: ' + atob(res));
                        // $('#array').html(resHTML);
                    }
                });
            }
        });*/
        
    });
    
    $('button#products').on('click', function(){
        showBooths();
    });
    
    $('button#wishlist').on('click', function(){
        
        showWishlist();
        
        $('html, body').animate({ scrollTop: 0 }, 150,"swing");
        
        $('.wishlist.item .addToWishlist').off('click');
        $('.wishlist.item .addToWishlist').on('click', function(){
            
            var wsID = $(this).parents('li').find('.id').text();
                        
            var c = allProducts.get("id", wsID)[0];
            
            c.values({
                isSelected: " "
            });
            
            var cDOM = c.elm;
            
            $(cDOM).removeClass('selected');
            $(cDOM).find('.addToWishlist > .glyphicon.glyphicon-heart').hide();
            $(cDOM).find('.addToWishlist > .glyphicon.glyphicon-plus-sign').show();
                                                
            $(this).parents('li').slideToggle(250, function(){
                ps.remove("id", wsID);
                
                checkIfWishlistEmpty();

            });

        });
        
        activateQtyCounter();
        
        $('#showWhichBooth').text('All');
        $('nav li').css({'background-color':'#000', 'color': '#fff'});
        filter('');
        
    })
    

};

$(document).ready(function() {
    
    $('#welcome').modal();
    
    // Get all products from PRODCAT when window loads    
    
    for (var i = 0; i < brands.length; i++) {
        getProducts(brands[i]);
    }
    
    $('#sortByBooth').on('click', function(){
        $('nav ul').slideToggle();
    })
    
    $('#welcome').on('hidden.bs.modal', function(e){
        $('nav ul').slideToggle();
    })
    
})


function updateCounter(){
    $('.badge').text(ps.size());
    // console.log(ps.items[0]._values.price);
    var subtotal = 0.00;
    for (i=0; i < ps.size(); i++){
        subtotal += Number(ps.items[i]._values.sale) * Number(ps.items[i]._values.qty);
    }
    $('#subtotal').text(formatMoneys(subtotal, 2));
}

/*

// Barcode scanning
function goScan() {
    Ti.App.fireEvent('app:goScan', { });
};

function tryAgain() {
    Ti.App.fireEvent('app:tryAgain', { });
};
*/


// Make the elements in List "all-products" clickable
// "Clickable" means we can add/remove them to the Wishlist,
// generate custom content, etc.

function activateClickSelect() {

    /*$(".products.item").on("touchstart", function() {
        $(this).css("opacity", 0.4);
    });
    $(".products.item").on("touchend", function() {
        $(this).css("opacity", 1);
    });*/

    $(".products.item").on("click", function(){

        $( this ).toggleClass("selected");
        

        // Store the HTML in a variable for later
        var x = $( this ).html(); 


        var txt = $( this ).find(".isSelected").text();
        var thisItem = $( this ).find(".isSelected");
        
        /* 
        Alternate method to get() the selected item
        Requires each product to have a unique 'id'
        We generate this 'id' programmatically later

        (Remember to add 'id' to List.js valueNames)
        ************
        */
        var thisItemID = $(this).find(".id").text();
        var b = allProducts.get('id', thisItemID)[0];
        
        var thisItemBrand = $(this).find(".brand").text();

        /*
        var thisItemPROD = $(this).find(".product").text();
        var b = allProducts.get('product', thisItemPROD)[0];
        */


        // If this has not been selected, give the list item a value of "wishlist"
        // for the 'isSelected' parameter
        // i.e. add to wishlist if not already in wishlist
        if ( txt === " " || !txt ) {
            
            $(this).find('.addToWishlist > .glyphicon.glyphicon-plus-sign').hide();
            $(this).find('.addToWishlist > .glyphicon.glyphicon-heart').fadeTo(300, 1);
            
            b.values({
                isSelected: "wishlist"
            });

            ps.add([ 
                { brand: thisItemBrand, productImage: b._values.productImage, prodRgnName: b._values.prodRgnName, shadeOrSize: b._values.shadeOrSize, formattedPrice: b._values.formattedPrice, sale: b._values.sale, formattedSale: b._values.formattedSale, qty: b._values.qty, id: thisItemID }
            ]);
            
            /*if (thisItemBrand === "rodin") {
                console.log("RODIN?: " + thisItemID);
            }*/
            
                        
            // ps.update();

            // addToPS( this );

        } else {
            
            $(this).find('.addToWishlist > .glyphicon.glyphicon-heart').hide();
            $(this).find('.addToWishlist > .glyphicon.glyphicon-plus-sign').fadeTo(300, 1);

            b.values({
                isSelected: " "
            });

            // ps.remove("product", thisItemPROD);
            ps.remove("id", thisItemID);

            // removeFromPS( this );
        }

        allProducts.update();
        checkIfWishlistEmpty();

    });
    
    $(function() {
        FastClick.attach(document.body);
    });

    // document.getElementById("searchProducts").style.background = "url('images/no-results.png') center 10% no-repeat";

};

function activateQtyCounter() {
    
    $('button.plus').off('click');
    $('button.plus').on('click', function(){
        var thisQty = $(this).prev('.qty').text();
        thisQty = Number(thisQty);
        thisQty += 1;
        $(this).prev('.qty').text(thisQty);
        
        // Update qty in the list (ps) item
        var thisItemID = $(this).parents(".col-xs-7").siblings(".id").text();
        var d = ps.get('id', thisItemID)[0];
        console.log(thisItemID);
        d.values({
            qty: thisQty
        });
        updateCounter();
        ps.update();
    });
    
    $('button.minus').off('click');
    $('button.minus').on('click', function(){
        var thisQty = $(this).next('.qty').text();
        thisQty = Number(thisQty);
        thisQty -= 1;
        if (thisQty < 1){
            thisQty = 1;
        }
        $(this).next('.qty').text(thisQty);
        
        var thisItemID = $(this).parents(".col-xs-7").siblings(".id").text();
        console.log(thisItemID);
        var d = ps.get('id', thisItemID)[0];
        
        d.values({
            qty: thisQty
        });
        updateCounter();
        ps.update();
    });
};


// Add an item to arrayPS (instantiated on window load)
// UNUSED
function addToPS( x ) {	
    var thisItemID = $( x ).find(".id").text();
    var a = allProducts.get('id', thisItemID)[0];

    arrayPS[ thisItemID ] = { 
        brand: a._values.brand, productImage: a._values.productImage, prodRgnName: a._values.prodRgnName, shadeOrSize: a._values.shadeOrSize, formattedPrice: a._values.formattedPrice, sale: a._values.sale, formattedSale: a._values.formattedSale, qty: a._values.qty, productID: a._values.id
    }
    // console.log(arrayPS[thisItemID].product);
}

// Remove an item from arrayPS
// Index is determined by a unique, programmatically-generated 'id'
function removeFromPS( x ) {
    var thisItemID = $( x ).find(".id").text();
    arrayPS[ thisItemID ] = null;
}


// ** This makes the call based on eCom nav structure **
// UNUSED, but I'm paranoid and this might come in handy
//var callUrl = 'http://www.cremedelamer.com/rpc/response.tmpl?JSONRPC=[{"method":"prodcat","params":[{"products":["PROD36895","PROD36897","PROD12343","PROD12378","PROD37290","PROD40452","PROD36892","PROD37265","PROD36893","PROD38735","PROD38731","PROD38675","PROD37261","PROD12482","PROD33704"],"product_fields":["PROD_RGN_NAME","LARGE_IMAGE","PRODUCT_ID","skus"],"sku_fields":["SHADENAME","PRODUCT_SIZE","UPC_CODE","PRODUCT_CODE","SKU_ID","formattedPrice","PRICE"]}]}]';

// http://www.cremedelamer.com/rpc/response.tmpl?JSONRPC=[{"method":"prodcat","params":[{"skus":["SKU64783","SKU64785","SKU26767","SKU43306","SKU26742","SKU65324","SKU69796","SKU64781","SKU65291","SKU64782","SKU65283","SKU59868","SKU26718","SKU67248","SKU67307","SKU67311"],"product_fields":["PROD_RGN_NAME","LARGE_IMAGE"],"sku_fields":["SHADENAME","PRODUCT_SIZE","UPC_CODE","PRODUCT_CODE","SKU_ID","formattedPrice","PRICE","product"]}]}]


/* ******** */
// DB STUFF

var dbinv = openDatabase('invdb', '1.0', 'BCA Inventory', 2 * 1024 * 1024);
var dbwish = openDatabase('wishdb', '1.0', 'BCA Wishlist', 2 * 1024 * 1024);

function createDb(){
    dbinv.transaction(function (tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS inventories (brand, inventory)');
        console.log('inv created');
    });
    dbwish.transaction(function (tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS wishlist (items DEFAULT "[ ]", id INTEGER DEFAULT "1")');

        console.log('wish created');
    });
    // INSERT an initial value for items; use UPDATE elsewhere
    dbwish.transaction(function (tx) {
        tx.executeSql('INSERT INTO wishlist (items, id) VALUES (?, 1);', ['[]'], function(tx, res){}, function(tx,err){});
    });

}

function destroyDb() {
    dbinv.transaction(function (tx){
        tx.executeSql('DROP TABLE inventories');
    });
    dbwish.transaction(function (tx){
        tx.executeSql('DROP TABLE wishlist');
    });
}

createDb();


function addDataToDbFromServer(forBrand,obj,status){
    // console.log("adding from server");
    dbinv.transaction(function (tx) {
        
        
        if (forBrand === "rodin" || forBrand === "adf" || forBrand === "la mer" || forBrand === "becca" || forBrand === "bumble" || forBrand === "jo malone" || forBrand === "origins" || forBrand === "aveda DIS" || forBrand === "bobbi brown" || forBrand === "m-a-c DIS" || forBrand === "clinique" || forBrand === "estee lauder DIS" || forBrand === "frederic malle" || forBrand === "smashbox" ) {
            var stringifiedObj = obj.responseText;
            // console.log("RODIN STRING: " + stringifiedObj);
        } else {
            var stringifiedObj = JSON.stringify(obj.responseJSON);
            // console.log("TYPICAL STRING: " + stringifiedObj);
        }
        
        // tx.executeSql('UDPATE inventories SET inventory=? WHERE brand=?;', [JSON.stringify(obj.responseJSON), forBrand]);

        tx.executeSql('SELECT * FROM inventories WHERE brand=?', [forBrand], function (tx, results) {
            
            
            // If dbinv is empty
            if (results.rows.length === 0) {
                // add the result object to dbinv (must be stringified and parsed later)
                tx.executeSql('INSERT INTO inventories (brand, inventory) VALUES (?, ?);', [forBrand, stringifiedObj], function(tx, res){ console.log(res.rows.length)}, function(tx,err){});

            } else {
                // otherwise update the existing brand entry
                // tx.executeSql('UPDATE inventories SET inventory=? WHERE brand=?;', [JSON.stringify(obj.responseJSON), forBrand], function(){}, function(tx,err){});
                tx.executeSql('UPDATE inventories SET inventory=? WHERE brand=?;', [stringifiedObj, forBrand], function(){}, function(tx,err){});
                // console.log(results.rows.length);
            }
        });

    });
}

// Use this function to add data already stored in localStorage (dbinv) to the DOM
function addDataToDomFromDb(forBrand) {
    
    dbinv.transaction(function (tx) {

        tx.executeSql('SELECT * FROM inventories WHERE brand=?', [forBrand], function (tx, results) {
            
            
            if (results.rows.length > 0){
                
                console.log('**********************');
            
                for( var i=0; i<results.rows.length; i++)
                {
                    var inv = results.rows.item(i).inventory;
                    var dataParsed = JSON.parse(inv);
                    
                    

                    var output = '';
                    bySku(dataParsed,forBrand);
                    
                    /*switch(forBrand){

                        case "aerin":
                            output += property + ': ' + dataParsed[property].prodRgnName + '; ';
                            bySku(dataParsed,forBrand,brandUrl);
                            break;

                    }*/
                    
                    for (var property in dataParsed){

                        console.log("length: " + dataParsed.length);

                    }

                    // Add 1 each time a brand's inventory is successfully retrieved from db
                    numBrandsGot++;
                    
                    // Update progress bar
                    $('.progress-bar').css('width', Math.floor(numBrandsGot/brands.length*100) + '%');
                    $('span.loading-progress').text(Math.floor(numBrandsGot/brands.length*100) + '%');

                    // Only add event handler when all brands' products are loaded
                    if (numBrandsGot === brands.length) {
                        activateClickSelect();
                        $('#loading-products').hide();
                        showBooths();
                    }

                    // console.log(results.rows.item(i).brand);
                    console.log("Sending from db: " + results.rows.item(i).brand);
                }
                
            } else {
                // error message: No internet connectivity
                // TO DO: Tap to try again.
            }
            
            

        });
    });
}





function getProducts( forBrand ){


    // THIS CALL WORKS (PRODCAT RPC)
    /*$.ajax({
      type: "POST",
      url: callUrl,
        jsonpCallback: 'successHandle',
        dataType: 'jsonp'
    });*/

    var layersUrl = "https://saleabration.herokuapp.com/brand/" + forBrand.replace(/\s+/g, '');;
    
    
    // LAYERS (LAYERS API)
    $.ajax({
        type: "GET",
        url: layersUrl,
        //dataType: 'json'

    }).error(function(data, status, err){

        console.log(status + " for " + forBrand);
        addDataToDomFromDb(forBrand);
        if (status === 'parseerror'){
            $('button#products').off('click');
            $('button#wishlist').off('click');
        }


    }).success(function(data, status, obj){

        addDataToDbFromServer(forBrand,obj,status);
        addDataToDomFromDb(forBrand);
        
        console.log("OBJ VS DATA(!)", data);

        // Examples: obj.responseJSON.length, obj.responseJSON[0].categoryName, obj.responseJSON[0].products.length
        // Examples: data.length, data[0].categoryName, data[0].products.length


    }).complete(function(obj, status){


    });
    

}


// add product data to the allProducts list.js
function bySku(data,brand) {
    
    // allProducts.clear();
    // console.log("data length: " + data.length);
    
    var idCounter = 0;
    var numSkus = data.length;

    for ( var a = 0; a < numSkus; a++) {
        
        console.log("this brand is: " + brand);
        
        

        var thisProduct = data[a];
        
        var thisName = thisProduct.parent.prodRgnName;
        var thisImage = thisProduct.parent.largeImage;
                
        
//        var thisPrice = thisProduct.price;
        var thisFormattedPrice = thisProduct.formattedPrice;
        var thisSale = thisProduct.sale;

        var thisShadeOrSize = thisProduct.shadeOrSize;

        // To be used if making the call by product (instead of sku)
        var allSizes = [];

        // To be used if enabling product scan
        var thisUpc = "";

        allProducts.add([ 
            { brand: brand, productImage: '<img src="' + thisImage + '" class="img-responsive" />', prodRgnName: thisName, formattedPrice: thisFormattedPrice, formattedSale: formatMoneys(thisSale,2), sale: thisSale, qty: 1, shadeOrSize: thisShadeOrSize, id: brand.trim() + idCounter }
        ]);
        allProducts.update();

        idCounter++;

    }
}


function byProduct(data,brand,brandUrl) {
    
    // allProducts.clear();
    
    var idCounter = 0;
    var numProducts = data.length;

    for ( var a = 0; a < numProducts; a++) {

        // console.log(data[a].prodRgnName);
        

        var thisProduct = data[a];

        var thisName = thisProduct.prodRgnName;
        var thisImage = brandUrl + thisProduct.largeImage;
        var thisPrice = thisProduct.skus[0].price;
        var thisFormattedPrice = thisProduct.skus[0].formattedPrice;
        var thisSale = thisProduct.sale;

        var thisShadeOrSize = '';
        
        // Does it have shades?
        if (thisProduct.shaded === 0) {
            // Does it have sizes?
            if (thisProduct.sized === 0) {
                // No shades, no sizes
                thisShadeOrSize = ''; 
            } else {
                // No shades, yes sizes
                thisShadeOrSize = thisProduct.skus[0].productSize; 
            }
            
        } else {
            // Yes shades
            thisShadeOrSize = thisProduct.skus[0].shadename; 
        }



        // To be used if making the call by product (instead of sku)
        var allSizes = [];

        // To be used if enabling product scan
        var thisUpc = "";

        allProducts.add([ 
            { brand: brand, productImage: '<img src="' + thisImage + '" class="img-responsive" />', prodRgnName: thisName, formattedPrice: thisFormattedPrice, formattedSale: formatMoneys(thisSale,2), sale: thisSale, shadeOrSize: thisShadeOrSize, id: brand.trim() + idCounter }
        ]);
        allProducts.update();

        idCounter++;

    }
}

function successHandleLayers() {
    // var numCat = json.length;
    // console.log("done");
}

function successHandle(json) {

    var idCounter = 0;
    var thisItemPROD = $(this).find(".product").text();
    var c = allProducts.get('product', thisItemPROD)[0];

    var numCATEGORIES = json[0].result.value.categories.length;

    for ( var i = 0; i < numCATEGORIES; i++ ) {

        var thisCategory = json[0].result.value.categories[i].CATEGORY_NAME;
        var numPRODUCTS = json[0].result.value.categories[i].products.length;

        for ( var j = 0; j < numPRODUCTS; j++ ) {

            var thisName = json[0].result.value.categories[i].products[j]["PROD_RGN_NAME"];
            var thisUrl = "http://www.bumbleandbumble.com" + json[0].result.value.categories[i].products[j]["SEO_URL"];
            var thisDescription = json[0].result.value.categories[i].products[j]["SHORT_DESC"];
            var thisKeywords = json[0].result.value.categories[i].products[j]["PROD_RGN_KEYWORDS"];
            var thisImage = "http://www.bumbleandbumble.com" + json[0].result.value.categories[i].products[j]["LARGE_IMAGE"];
            var thisThumbnail = "http://www.bumbleandbumble.com" + json[0].result.value.categories[i].products[j]["THUMBNAIL_IMAGE"];
            var allSizes = [];
            var thisSize = "";
            var thisUpc = "";

            // CHECK FOR MULTIPLE OBJECTS IN "skus" ARRAY
            // (Indicates multiple sizes)
            if ( json[0].result.value.categories[i].products[j]["skus"].length == 1 ) {
                var thisSku = json[0].result.value.categories[i].products[j]["skus"][0]["SKU_ID"];
                var thisPrice = json[0].result.value.categories[i].products[j]["skus"][0]["formattedPrice"];
                thisUpc = json[0].result.value.categories[i].products[j]["skus"][0]["UPC_CODE"];
                thisSize = '<div class="padleft bold">' + json[0].result.value.categories[i].products[j]["skus"][0]["PRODUCT_SIZE"] + '</div>';

            } else {
                var thisUpc = json[0].result.value.categories[i].products[j]["skus"][0]["UPC_CODE"];
                var thisSku = json[0].result.value.categories[i].products[j]["skus"][0]["SKU_ID"];
                var numSIZES = json[0].result.value.categories[i].products[j]["skus"].length;

                for ( var k = 0; k < numSIZES; k++ ) {
                    // How do we capture / store each price? PRICE[] array?
                    allSizes[k] = json[0].result.value.categories[i].products[j]["skus"][k]["PRODUCT_SIZE"];
                    thisSize += '<div class="sizeOption col-md-6"><input value="' + allSizes[k] + '" type="checkbox" /><label>' + allSizes[k] + '</label></div>';
                    thisUpc += json[0].result.value.categories[i].products[j]["skus"][k]["UPC_CODE"] + " ";

                }
            }

            if ( thisCategory.search("stress-fix") >= 0 ) {
                console.log(thisUpc);
            }

            allProducts.add([ 
                { category: thisCategory, productImage: '<img src="' + thisImage + '" class="img-responsive" />', thumbnail: '<img src="' + thisThumbnail + '" />', product: thisName, description: thisDescription, sku: thisSku, sizes: thisSize, upc: thisUpc, keywords: thisKeywords, url: thisUrl, id: idCounter }
            ]);
            allProducts.update();

            idCounter++;
        }
    }
    // console.log( thisUpc );

    activateClickSelect();

    /*
    Ti.App.addEventListener('app:scannedBarcode', function(f) {
        document.getElementById("searchBar").value = "";
        allProducts.search(f.thisBarcode);
        showSearch();
    });
    */
}

