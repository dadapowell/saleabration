// require express
var express 	= require("express");
var path 		= require("path");
var request     = require("request");

var async       = require("async");
var pool        = require("./lib/db");
var uniqid      = require("uniqid");
var bodyParser  = require('body-parser');

var json2csv = require('json2csv');
var fs = require('fs');


// create router object
var router = express.Router();

// export router
module.exports = router;

// GLOBAL FUNCTIONS
function formatMoneys (nThis, c, d, t){
    var n = nThis, 
        c = isNaN(c = Math.abs(c)) ? 2 : c, 
        d = d == undefined ? "." : d, 
        t = t == undefined ? "," : t, 
        s = n < 0 ? "-" : "", 
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
        j = (j = i.length) > 3 ? j % 3 : 0;
       return s + "$" + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 };

function getProductsFromURL (response, brandInfo, brandProducts = []){
    
    var responseLength = response.body.length;
    
    var brandURL = brandInfo.brandURL !== ' ' ? brandInfo.brandURL : brandInfo.otaURL;
    var otaURL = brandInfo.otaURL;
    var brand = brandInfo.brand;
    var jsonURL = brandInfo.jsonURL;
    var apiURL = brandInfo.apiURL;

    for (var i = 0; i < responseLength; i++){
        var thisProduct = response.body[i];
        var thisProdRgnName = thisProduct.parent.prodRgnName;
        var thisFormattedPrice = thisProduct.formattedPrice;
        var thisSale = thisProduct.sale;
        var thisShadeOrSize, thisFormattedSale, thisFullImageURL, thisItemID;

        thisFormattedSale = formatMoneys(thisProduct.sale);
        
        // We will only ever show Shade OR Product Size in the app
        
        if (thisProduct.shadename === null) {
            if (thisProduct.productSize) {
                thisShadeOrSize = thisProduct.productSize; 
            } else { thisShadeOrSize = ' '; }

        } else {
            thisShadeOrSize = thisProduct.shadename; 
        }
        
        if (thisProduct.skuId && thisProduct.skuId !== ""){
            thisItemID = thisProduct.skuId;
        } else if (thisProduct.path && thisProduct.path !== ""){
            thisItemID = thisProduct.path;
        } else {
            thisItemID = brand.replace(/\s+/g, '') + i;
        }
        
        // SBX largeImage[0] for 24H primer is a broken link
        // CLINIQUE parent.largeImage[0] for 71MC45 is broken
        // ORIGINS imageL[0] for 767G90 is a broken link
        // ORIGINS imageL[0] for 0LJ590 is a broken link
        // ORIGINS imageL[0] for 0MTL90 is a broken link

        var isShaded = thisProduct.parent.shaded;
        var imageValueType = typeof thisProduct.parent.largeImage;


        if (brandURL === '') {

            // Hack to make sure we get the right image URL
            thisFullImageURL = thisProduct.largeImage[0];

        } else if (thisProduct.parent.largeImageDefault) {

            // For discontinued items whose images had to be manually entered via JSON file
            // e.g. BOBBI BROWN
            thisFullImageURL = thisProduct.parent.largeImageDefault[0];

        } else if (isShaded === 1 && thisProduct.imageSmooshL) {

            // Many products may have shaded skus, but not every brand has dedicated smoosh images
            // Note that the following brands use a transparent smoosh image, and sets the background color of the containing div based on hexValue
            // CLINIQUE, ORIGINS, SBX*
            // *SBX uses a combination product+smoosh image as well

            // BOBBI: imageSmooshL
            thisFullImageURL = brandURL + thisProduct.imageSmooshL;

        } else if (isShaded === 1 && thisProduct.largeSmoosh) {

            // ESTEE: largeSmoosh
            thisFullImageURL = thisProduct.largeSmoosh;

        } else if (isShaded === 1 && thisProduct.imageSmoosh) {

            // MAC: imageSmoosh
            thisFullImageURL = thisProduct.imageSmoosh;

        } else if (thisProduct.largeImage && typeof thisProduct.largeImage == 'object' && thisProduct.largeImage[0].search('http') >= 0) {

            // Check for http
            // This indicates an absolute URL
            thisFullImageURL = thisProduct.largeImage[0];

        } else if (thisProduct.largeImage && thisProduct.largeImage[0] !== '/media/images/products/875x773/sbx_sku_53710_875x773_0.jpg') {

            // Check for existence of large image (sku level)
            // Hack to get around SBX issue (see above)
            // Hack to make sure Clinique images load properly
            if (thisProduct.largeImage[0] !== "/") {
                thisFullImageURL = brandURL + thisProduct.largeImage[0];
            } else {
                thisFullImageURL = brandURL + thisProduct.largeImage;
            }
            

        } else if (thisProduct.mediumImage) {

            // Fallback to medium image as necessary
            thisFullImageURL = brandURL + thisProduct.mediumImage[0];

        } else if (thisProduct.parent.largeImage && imageValueType == 'object' && thisProduct.parent.largeImage[0].search('http') >= 0) {

            // Check for http
            // This indicates an absolute URL
            thisFullImageURL = thisProduct.parent.largeImage[0];

        } else if (thisProduct.parent.largeImage && imageValueType == 'object' && thisProduct.parent.largeImage !== '/media/export/cms/products/402x464/clq_71MC45_402x464.png') {

            // Check the parent for the large image
            // if parent.largeImage is an object
            // get the first item
            // + Hack to get around CLINIQUE issue (see above)
            thisFullImageURL = brandURL + thisProduct.parent.largeImage[0];

        } else if (thisProduct.parent.largeImage && imageValueType == 'string' && thisProduct.parent.largeImage.search('http') >= 0) {

            // Check for http
            // This indicates an absolute URL
            thisFullImageURL = thisProduct.parent.largeImage;

        } else if (thisProduct.parent.largeImage && imageValueType == 'string' && thisProduct.parent.largeImage !== '/media/export/cms/products/402x464/clq_71MC45_402x464.png') {

            // Check the parent for the large image
            // if parent.largeImage is a string
            // get the string value
            // + Hack to get around CLINIQUE issue (see above)
            thisFullImageURL = brandURL + thisProduct.parent.largeImage;

        } else if (thisProduct.parent.imageL && thisProduct.parent.imageL[0] !== '/media/export/cms/products/500x625/origins_sku_767G90_500x625_0.png' && thisProduct.parent.imageL[0] !== '/media/export/cms/products/500x625/origins_sku_0LJ590_500x625_0.png' && thisProduct.parent.imageL[0] !== '/media/export/cms/products/500x625/origins_sku_0MTL90_500x625_0.png') {

            // Check the parent for the large image
            // This parameter varies by brand, so we have to check
            // + Hack to get around ORIGINS issue (see above)
            thisFullImageURL = brandURL + thisProduct.parent.imageL[0];;

        } else {

            // If everything fails, show this default image from the brand dir on OTA
            thisFullImageURL = otaURL + '/noimage.png';

        }

        var thisProductObj = {
            "shadeOrSize": thisShadeOrSize,
            "formattedPrice": thisFormattedPrice,
            "formattedSale": thisFormattedSale,
            "sale": Number(thisSale),
            "brand": brand,
            "id": thisItemID,
            "qty": 1,
            "shaded": isShaded,
            "parent": {
                "prodRgnName": thisProdRgnName,
                "largeImage": thisFullImageURL
            }
        }

        brandProducts.push(thisProductObj);
//        console.log("BRAND: ", brandProducts);
        
    }
    
    return brandProducts;
    
};

function sortBy (field, reverse, primer){

   var key = primer ? 
       function(x) {return primer(x[field])} : 
       function(x) {return x[field]};

   reverse = !reverse ? 1 : -1;

   return function (a, b) {
       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
     } 
};

router.use(bodyParser.json());

router.get('/featured', function(req, res) {
    
    // BEST SELLERS list
    
    var featuredProducts = {};
    
    featuredProducts.brand = 'featured';
    featuredProducts.brandURL = ' ';
    featuredProducts.otaURL = 'http://ota.esteeonline.com/wishlist/images/featured';
    featuredProducts.apiURL = ' ';
    featuredProducts.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/featured.json';
    
    // RETURN the list for the specified :id
    request({method: 'GET', uri: featuredProducts.jsonURL, json: true}, function(error, response, body){
        if (!error){

            var prod1 = getProductsFromURL(response, featuredProducts);
            
            res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
            res.end(JSON.stringify(prod1));

        } else {
            console.log('error: ', error);
            res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
            res.end(JSON.stringify([{"error": "Something's wrong"}]));
        }
    });

});

router.get('/brands', function(req, res) {
    
    // RETURN the list for the specified :id
    var allBrands = [
        { "brand": "adf", "slug": "adf", "title": "ADF" },
        { "brand": "aerin", "slug": "aerin", "title": "AERIN" },
        { "brand": "aveda", "slug": "aveda", "title": "Aveda" },
        { "brand": "becca", "slug": "becca", "title": "BECCA" },
        { "brand": "bobbibrown", "slug": "bobbibrown", "title": "Bobbi Brown" },
        { "brand": "bumble", "slug": "bumble", "title": "Bumble and bumble" },
        { "brand": "clinique", "slug": "clinique", "title": "Clinique" },
        { "brand": "darphin", "slug": "darphin", "title": "Darphin" },
        { "brand": "esteelauder", "slug": "esteelauder", "title": "Estée Lauder" },
        { "brand": "fredericmalle", "slug": "fredericmalle", "title": "Editions de Parfums Frédéric Malle" },
        { "brand": "jomalone", "slug": "jomalone", "title": "Jo Malone London" },
        { "brand": "labseries", "slug": "labseries", "title": "LAB Series" },
        { "brand": "lamer", "slug": "lamer", "title": "La mer" },
        { "brand": "m-a-c", "slug": "m-a-c", "title": "M•A•C" },
        { "brand": "origins", "slug": "origins", "title": "Origins" },
        { "brand": "smashbox", "slug": "smashbox", "title": "Smashbox" },
        { "brand": "tomford", "slug": "tomford", "title": "Tom Ford" }
        
    ];
    
        res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
        res.end(JSON.stringify(allBrands));

});

router.get('/brand/:brand', function(req, res) {
    
    // RETURN brand products
    
    var forBrand = req.params.brand;
    var brandInfo = {};
    
    // NOTE: Values below can be adjusted (hacked) as necessary
    // e.g. otaURL for MAC is same as brandURL (discontinued image paths were still valid)
    
    switch (forBrand) {

        case "aveda":
            brandInfo.brand = 'aveda';
            brandInfo.brandURL = 'http://www.aveda.com';
            brandInfo.otaURL = 'http://ota.esteeonline.com/wishlist/images/aveda';
//          brandInfo.apiURL = 'http://ota.esteeonline.com/wishlist/manifest/aveda1.json';
            brandInfo.apiURL = 'https://layers.esteeonline.com/api/prodcat/LAYER0250/skus?q={%22data.collection%22:%22bca%22}&select=shadename,formattedPrice,productSize,largeImage,parent.prodRgnName,parent.largeImage,parent.imageL,parent.shaded,sale,hexValueString,imageSmooshL,skuId';
            brandInfo.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/aveda.json';
            break;

            case "aerin":
            brandInfo.brand = 'aerin';
            brandInfo.brandURL = ' ';
            brandInfo.otaURL = 'http://ota.esteeonline.com/wishlist/images/aerin';
            brandInfo.apiURL = ' ';
            brandInfo.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/aerin.json';
            break;

        case "becca":
            brandInfo.brand = 'becca';
            brandInfo.brandURL = ' ';
            brandInfo.otaURL = 'http://ota.esteeonline.com/wishlist/images/becca';
            brandInfo.apiURL = ' ';
            brandInfo.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/becca.json';
            break;

        case "bobbibrown":
            brandInfo.brand = 'bobbi brown';
            brandInfo.brandURL = 'http://www.bobbibrown.com';
            brandInfo.otaURL = 'http://ota.esteeonline.com/wishlist/images/bobbi';
            brandInfo.apiURL = " ";
//          brandInfo.apiURL = 'https://layers.esteeonline.com/api/prodcat/LAYER0246/skus?q={"data.collection":"bca"}&select=shadename,formattedPrice,productSize,largeImage,parent.prodRgnName,parent.largeImage,parent.imageL,parent.shaded,sale,hexValueString,imageSmooshL,skuId';
            brandInfo.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/bobbi.json';
            break;


        case "bumble":
            brandInfo.brand = 'bumble';
            brandInfo.brandURL = ' ';
            brandInfo.otaURL = 'http://ota.esteeonline.com/wishlist/images/bumble';
            brandInfo.apiURL = ' ';
            brandInfo.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/bumble.json';
            break;

        // case "bumble":
        //     brandInfo.brand = 'bumble and bumble';
        //     brandInfo.brandURL = ' ';
        //     brandInfo.otaURL = 'http://ota.es teeonline.com/wishlist/images/bumble';
        //     brandInfo.apiURL = ' ',
//          brandInfo.apiURL = 'https://layers.esteeonline.com/api/prodcat/LAYER0247/skus?q={"data.collection":"bca"}&select=shadename,formattedPrice,productSize,largeImage,parent.prodRgnName,parent.largeImage,parent.imageL,sale,skuId';
            // brandInfo.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/bumble.json';
            // break;

        case "clinique":
            brandInfo.brand = 'clinique';
            brandInfo.brandURL = ' ';
            brandInfo.otaURL = 'http://ota.esteeonline.com/wishlist/images/clinique';
            brandInfo.apiURL = ' ';
//          brandInfo.apiURL = 'https://layers.esteeonline.com/api/prodcat/LAYER0025/skus?q={"data.collection":"bca"}&select=shadename,formattedPrice,productSize,largeImage,parent.prodRgnName,parent.largeImage,parent.imageL,sale,skuId';
            brandInfo.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/clinique.json';
            break;

        case "darphin":
            brandInfo.brand = 'darphin';
            brandInfo.brandURL = 'http://www.darphin.com';
            brandInfo.otaURL = 'http://ota.esteeonline.com/wishlist/images/darphin';
            brandInfo.apiURL = 'https://layers.esteeonline.com/api/prodcat/LAYER0272/skus?q={"data.collection":"bca"}&select=shadename,formattedPrice,productSize,largeImage,parent.prodRgnName,parent.largeImage,parent.imageL,sale,skuId';
            brandInfo.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/darphin.json';
            break;

        case "esteelauder":
            brandInfo.brand = 'estee lauder';
            brandInfo.brandURL = ' ';
            brandInfo.otaURL = 'http://ota.esteeonline.com/wishlist/images/estee';
            brandInfo.apiURL = ' ';
            brandInfo.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/esteelauder.json';
            break;

        case "jomalone":
            brandInfo.brand = 'jo malone';
            brandInfo.brandURL = ' ';
            brandInfo.otaURL = 'http://ota.esteeonline.com/wishlist/images/jomalone';
            brandInfo.apiURL = ' ';
            brandInfo.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/jomalone.json';
            break;

        case "labseries":
            brandInfo.brand = 'lab series';
            brandInfo.brandURL = 'http://www.labseries.com';
            brandInfo.otaURL = ' ';
            brandInfo.apiURL = 'https://layers.esteeonline.com/api/prodcat/LAYER0274/skus?q={"data.collection":"bca"}&select=shadename,formattedPrice,productSize,largeImage,parent.prodRgnName,parent.largeImage,parent.imageL,sale,skuId';
            brandInfo.jsonURL = ' ';
            break;

        case "lamer":
            brandInfo.brand = 'la mer';
            brandInfo.brandURL = ' ';
            brandInfo.otaURL = 'http://ota.esteeonline.com/wishlist/images/lamer';
            brandInfo.apiURL = ' ';
            brandInfo.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/lamer.json';
            break;

        case "m-a-c":
            brandInfo.brand = 'm-a-c';
            brandInfo.brandURL = 'http://www.maccosmetics.com';
            brandInfo.otaURL = 'http://ota.esteeonline.com/wishlist/images/mac';
            brandInfo.apiURL = 'https://layers.esteeonline.com/api/prodcat/LAYER0024/skus/?q={"data.collection":"bca"}&select=shadename,formattedPrice,productSize,largeImage,parent.prodRgnName,parent.largeImage,parent.imageL,sale,skuId';
            brandInfo.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/mac.json';
            break;

        case "origins":
            brandInfo.brand = 'origins';
            brandInfo.brandURL = ' ';
            brandInfo.otaURL = 'http://ota.esteeonline.com/wishlist/images/origins';
            brandInfo.apiURL = ' ';
//          brandInfo.apiURL = 'https://layers.esteeonline.com/api/prodcat/LAYER0249/skus?q={"data.collection":"bca"}&select=shadename,formattedPrice,productSize,largeImage,parent.prodRgnName,parent.largeImage,parent.imageL,sale,skuId';
            brandInfo.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/origins.json';
            break;

        case "smashbox":
            brandInfo.brand = 'smashbox';
            brandInfo.brandURL = ' ';
            brandInfo.otaURL = 'http://ota.esteeonline.com/wishlist/images/smashbox';
            brandInfo.apiURL = ' ';
//          brandInfo.apiURL = 'https://layers.esteeonline.com/api/prodcat/LAYER0248/skus?q={"data.collection":"bca"}&select=shadename,formattedPrice,productSize,largeImage,mediumImage,parent.prodRgnName,parent.largeImage,parent.imageL,sale,skuId';
            brandInfo.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/smashbox.json';
            break;

        case "adf":
            brandInfo.brand = 'adf';
            brandInfo.brandURL = ' ';
            brandInfo.otaURL = 'http://ota.esteeonline.com/wishlist/images/adf';
            brandInfo.apiURL = ' ';
            brandInfo.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/adf.json';
            break;

        case "fredericmalle":
            brandInfo.brand = 'frederic malle';
            brandInfo.brandURL = ' ';
            brandInfo.otaURL = 'http://ota.esteeonline.com/wishlist/images/fredericmalle';
            brandInfo.apiURL = ' ';
            brandInfo.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/fredericmalle.json';
            break;

        case "featured":
            brandInfo.brand = 'featured';
            brandInfo.brandURL = ' ';
            brandInfo.otaURL = 'http://ota.esteeonline.com/wishlist/images/featured';
            brandInfo.apiURL = ' ';
            brandInfo.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/featured.json';
            break;

        case "tomford":
            brandInfo.brand = 'tom ford';
            brandInfo.brandURL = ' ';
            brandInfo.otaURL = 'http://ota.esteeonline.com/wishlist/images/tomford';
            brandInfo.apiURL = ' ';
            brandInfo.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/tomford.json';
            break;

        case "wips_donations":
            brandInfo.brand = 'wips_donations';
            brandInfo.brandURL = ' ';
            brandInfo.otaURL = 'http://ota.esteeonline.com/wishlist/images';
            brandInfo.apiURL = ' ';
            brandInfo.jsonURL = 'http://ota.esteeonline.com/wishlist/manifest/wip.json';
            break;
    }
    
    // async:
    // Make separate calls for apiURL (Layers) and jsonURL (discontinued projects added manually)
    // Only make the call if the appropriate url exists
    
    async.series([
        function(callback){
            
            // LAYERS products
            
            if (brandInfo.apiURL !== " ") {
                request({method: 'GET', uri: brandInfo.apiURL, json: true}, function(error, response, body ){
                    if (!error){

                        var prod1 = getProductsFromURL(response, brandInfo);
                        callback(null, prod1);

                    } else {
                        console.log('error: ', error);
                    }
                });
            } else {
                callback(null, []);
            }

        },
        function(callback){
            
            // DISCONTINUED products (JSON file)
            
            if (brandInfo.jsonURL !== " ") {
                request({method: 'GET', uri: brandInfo.jsonURL, json: true}, function(error, response, body ){
                    if (!error){

                        var prod2 = getProductsFromURL(response, brandInfo);
                        callback(null, prod2);

                    } else {
                        console.log('error: ', error);
                    }
                });
            } else {
                callback(null, []);
            }
            
            
            
        }
    ], function(err, results){
        
        var final = results[0].concat(results[1]);
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
        res.end(JSON.stringify(final));
                
    });
    
});


// LISTS
// ******

router.post('/lists/new/:id', function (req, res) {
    
    // Generate a new userID
    // Add a NEW USER to the table with this userID
    
    var userID = req.params.id;
    var firstname = req.body.firstname;
    var email = req.body.email;
    var itemsObj = [];
    
    pool.query('INSERT INTO lists(userid, firstname, email, items) VALUES($1, $2, $3, $4);', [userID, firstname, email, JSON.stringify(itemsObj)])
    .then(function(r){
    
        var final = { "userID":userID, "firstname":firstname, "email":email };
        res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
        res.end(JSON.stringify(final));
    
    })
    .catch(function(c){
        res.writeHead(404, {"Content-Type": "application/json; charset=utf-8"});
        res.end(JSON.stringify({"error": "User already exists"}));
    });
});

router.get('/lists/get/:id', function(req, res) {
    
    // RETURN the list for the specified :id
    
    var userID = req.params.id;
    
    if (userID == '' || userID == ' '){
        res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
        res.end([{}]);
    } else {
        pool.query('SELECT items FROM lists WHERE userid=$1;', [userID])
            .then(function(r){

                var final = r.rows[0].items;
                var itemCount = r.rows[0].items.length;
                var subtotal = 0;
                for (var i = 0; i < itemCount; i++){
                    var thisItem = r.rows[0].items[i];
                    thisItem.formattedSale = formatMoneys(thisItem.sale * thisItem.qty);
                }
                res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
                res.end(JSON.stringify(final));

            })
            .catch(console.log);
    }

});

router.get('/lists/count/:id', function(req, res) {
    
    // RETURN the total quantity of items for the specified :id
    
    var userID = req.params.id;
    
    if (userID == '' || userID == ' '){
        res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
        res.end([{}]);
    } else {
        pool.query('SELECT items FROM lists WHERE userid=$1;', [userID])
            .then(function(r){
            
                var subtotal = 0;
                var itemCount = r.rows[0].items.length;
            
                // Not just the length -- the count, considering the desired quantity
                var itemCountWithQty = 0;
            
            
                for (var i = 0; i < itemCount; i++){
                    var thisItem = r.rows[0].items[i];
                    itemCountWithQty += Number(thisItem.qty);
                    subtotal += (thisItem.sale * thisItem.qty);
                }
                var final = {
                    "user": userID,
                    "count": itemCountWithQty,
                    "subtotal": formatMoneys(subtotal)
                };
                
                res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
                res.end(JSON.stringify(final));

            })
            .catch(console.log);
    }

});

router.get('/lists/sort/:id/:sorted/:reverse', function(req, res) {
    
    // RETURN the list for the specified :id, sorted by :sorted (key) and :reverse (asc/desc) criteria    
    var userID = req.params.id;
    var sorted = req.params.sorted;
    var reverse = req.params.reverse === 'true' || req.params.reverse === '1' ? true : false;
    
//    console.log("REVERSE: " + reverse + ", TYPEOF: " + typeof JSON.parse(reverse));
    
    var listURL = 'https://saleabration.herokuapp.com/lists/get/' + userID;

    var sorted_final = [];
    
    request({method: 'GET', uri: listURL, json: true}, function(error, response, body ){
        if (!error){
            
            sorted_final = response.body;
            
            // If we're sorting by sale, parse the values for 'sale' as integers
            // Otherwise, don't parse
            if (sorted === 'sale'){
                sorted_final.sort(sortBy(sorted, reverse, parseInt));
            } else {
                sorted_final.sort(sortBy(sorted, reverse));
            }
            
            res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
            res.end(JSON.stringify(sorted_final));
            
        } else {
            console.log('error: ', error);
        }
    });
    
});

router.post('/lists/add/:id', function (req, res) {
    
    // UPDATE the user's list
    
    var userID = req.params.id;
//    console.log("BODY? ", Object.keys(req));
    
    var prodRgnName     = req.body.parent.prodRgnName,
        itemID          = req.body.id,
        sale            = req.body.sale,
        qty             = req.body.qty,
        brand           = req.body.brand,
        formattedPrice  = req.body.formattedPrice,
        formattedSale   = req.body.formattedSale,
        largeImage      = req.body.parent.largeImage,
        shadeOrSize     = req.body.shadeOrSize;
    
    // Sent in POST body from Dropsource
    // This will be a single item object {}
    
    var postData = {
        "id": itemID,
        "sale": sale,
        "qty": Number(qty),
        "brand": brand,
        "formattedPrice": formattedPrice,
        "formattedSale": formattedSale,
        "shadeOrSize": shadeOrSize,
        "parent": {
            "prodRgnName": prodRgnName,
            "largeImage": largeImage
        }
    }
    
    var itemsArray = [];
    var itemAddedorDeleted;
    
    async.series([
        function(callback){
            
            // We will first SELECT and return the items column for the user
            // User's row / ID will be created when they first open the app
            pool
                .query('SELECT items FROM lists WHERE userid=$1;', [userID])
                .then(function(r){

                    // Filter for incoming obj's ID
                    // e.g. https://www.w3schools.com/code/tryit.asp?filename=FIL49RWFVOJH
                    itemsArray = r.rows[0].items;
                    var itemAlreadyExists = itemsArray.filter(item => item["id"] == itemID);
                                    
                    // If exists ? DELETE : ADD
                    if (itemAlreadyExists[0]){
                        
                        // DELETE: Filter items value for incoming object's id, save this filtered object
                        console.log("Item Exists. Delete instead.");
                        
                        var itemsArrayMinusThisItem = itemsArray.filter(item => item["id"] != itemID);
                        
                        console.log("ITEMS ARRAY: ", JSON.stringify(itemsArray));
                        console.log("ITEM REMOVED: ", JSON.stringify(itemsArrayMinusThisItem));
                        
                        itemsArray = itemsArrayMinusThisItem;
                        itemAddedorDeleted = "Deleted";
                        
                    } else {
                        
                        // ADD: Push the object to the itemsArray value
                        itemsArray.push(postData);
                        console.log("POST DATA: ", postData);
                        console.log("PUSHING postData: ", itemsArray);
                        
                        itemAddedorDeleted = "Added";
                        
                    }
                
                    callback(null, itemAddedorDeleted);

                })
                .catch(console.log);

        },
        function(callback){
            
            console.log("ADD THIS, FOOL: ", itemsArray);
            // UPDATE items column
            pool
                .query('UPDATE lists SET items=$1 where userid=$2;', [JSON.stringify(itemsArray), userID])
                .then(function(r){

                    console.log("Item " + itemID);

                })
                .catch(console.log);
            
                callback(null, [ userID, itemID ]);
            
        }
    ], function(err, results){
        
        var final = [{
            "user": results[1][0],
            "item": results[1][1],
            "status": results[0]
        }];
        res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
        res.end(JSON.stringify(final));
        
//        res.end(itemAddedorDeleted);
                
    });

});

router.post('/lists/add/:id/:qty', function (req, res) {
    
    // UPDATE the quantity for a specific item in the user's list
    
    var userID = req.params.id;
//    console.log("BODY? ", Object.keys(req));
    
    var prodRgnName     = req.body.parent.prodRgnName,
        itemID          = req.body.id,
        sale            = req.body.sale,
        qty             = req.params.qty,
        brand           = req.body.brand,
        formattedPrice  = req.body.formattedPrice,
        formattedSale   = req.body.formattedSale,
        largeImage      = req.body.parent.largeImage,
        shadeOrSize     = req.body.shadeOrSize;
    
    // Sent in POST body from Dropsource
    // This will be a single item object {}
    
    var postData = {
        "id": itemID,
        "sale": sale,
        "qty": Number(qty),
        "brand": brand,
        "formattedPrice": formattedPrice,
        "formattedSale": formattedSale,
        "shadeOrSize": shadeOrSize,
        "parent": {
            "prodRgnName": prodRgnName,
            "largeImage": largeImage
        }
    }
    
    var itemsArray = [];
    var itemAddedorDeleted;
    
    async.series([
        function(callback){
            
            // We will first SELECT and return the items column for the user
            // User's row / ID will be created when they first open the app
            pool
                .query('SELECT items FROM lists WHERE userid=$1;', [userID])
                .then(function(r){

                    // Filter for incoming obj's ID
                    // e.g. https://www.w3schools.com/code/tryit.asp?filename=FIL49RWFVOJH
                    itemsArray = r.rows[0].items;
                    var itemAlreadyExists = itemsArray.filter(item => item["id"] == itemID);
                                    
                    // If exists ? UPDATE : ADD
                    if (itemAlreadyExists[0]){
                        
                        // Instead of deleting, update
                        console.log("Item Exists. Delete old entry first.");
                        
                        var itemsArrayMinusThisItem = itemsArray.filter(item => item["id"] != itemID);
                        
                        itemsArrayMinusThisItem.push(postData);
                        itemsArray = itemsArrayMinusThisItem;
                        
                        console.log("NEW ITEMS ARRAY (QTY): ", JSON.stringify(itemsArray));
                        
                        
                        
                    } else {
                        
                        // Do nothing; the itemID should be in the list if this endpoint is called.
                    }
                
                    callback(null, qty);
                    

                })
                .catch(console.log);

        },
        function(callback){
            
            console.log("ADD THIS, FOOL: ", itemsArray);
            // UPDATE items column
            pool
                .query('UPDATE lists SET items=$1 where userid=$2;', [JSON.stringify(itemsArray), userID])
                .then(function(r){

                    console.log("Item " + itemID);

                })
                .catch(console.log);
            
                callback(null, [ userID, itemID ]);
            
        }
    ], function(err, results){
        
        var final = [{
            "user": results[1][0],
            "item": results[1][1],
            "qty": results[0]
        }];
        res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
        res.end(JSON.stringify(final));
        
//        res.end(itemAddedorDeleted);
                
    });

});


// ORDERS
// ******

router.post('/orders/new/:id', function (req, res) {
    
    // Generate a new userID
    // Add a NEW USER to the table with this userID
    
    var userID      = req.params.id;
    var firstname   = req.body.firstname;
    var email       = req.body.email;
    var itemsObj = [];
    
    pool.query('INSERT INTO orders(userid, firstname, email, items) VALUES($1, $2, $3, $4);', [userID, firstname, email, JSON.stringify(itemsObj)])
    .then(function(r){
    
        var final = { "userID": userID };
        res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
        res.end(JSON.stringify(final));
    
    })
    .catch(function(c){
        res.writeHead(404, {"Content-Type": "application/json; charset=utf-8"});
        res.end(JSON.stringify({"error": "User already exists"}));
    });
});

router.post('/orders/confirm/:id', function(req, res) {
    
    // Save confirmed order from Dropsource local array to the "orders" table
    
    var userID      = req.params.id;
    var bodyItems   = req.body.items;
        
    // Insert item array into orders db
    pool
        .query('UPDATE orders SET items=$2 WHERE userid=$1;', [userID, JSON.stringify(bodyItems)])
        .then(function(s){

            var final = [{ "userID": userID, "status": "confirmed" }];
            res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
            res.end(JSON.stringify(final));

        })
        .catch(console.log);

});


router.post('/orders/copy/:id', function(req, res) {
    
    // Copy order from "lists" to "orders" table
    //
    // formerly known as the /confirm endpoint
    // May become obsolete
    
    var userID      = req.params.id;
    var firstname   = req.body.firstname;
    var email       = req.body.email;
    
    var itemsArray = [];
    
    async.series([
        function(callback){
            
            // Get items from list db for this user
            pool
                .query('SELECT items FROM lists WHERE userid=$1;', [userID])
                .then(function(r){
                    itemsArray = r.rows[0].items;
                    callback(null, itemsArray);

                })
                .catch(console.log);

        },
        function(callback){
            
            // Insert item array into orders db
            pool
                .query('INSERT INTO orders(userid, firstname, email, items) VALUES($1, $2, $3, $4);', [userID, firstname, email, JSON.stringify(itemsArray)])
                .then(function(s){

                    var final = {"userID":userID};
                    res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
                    res.end(JSON.stringify(final));

                })
                .catch(console.log);
            
            callback(null, userID);
            
        }
    ], function(err, results){
        
        if (err){
            // error!
        } else {
            var final = [{
                "user": userID,
                "item": results[0],
                "status": "confirmed"
            }];
            res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
            res.end(JSON.stringify(final));
        }
        
                        
    });
    
    

});


router.get('/orders/get/:id', function(req, res) {
    
    // Retrieve previously confirmed order
    
    var userID = req.params.id;
    
    if (userID == '' || userID == ' '){
        res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
        res.end([{}]);
    } else {
        pool.query('SELECT items FROM orders WHERE userid=$1;', [userID])
            .then(function(r){

                var final = r.rows[0].items;
                res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
                res.end(JSON.stringify(final));

            })
            .catch(console.log);
    }

});

router.get('/orders/total/:id', function(req, res) {
    
    // RETURN the total item quantity and subtotal
    
    var userID = req.params.id;
    
    if (userID == '' || userID == ' '){
        res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
        res.end([{}]);
    } else {
        pool.query('SELECT items FROM orders WHERE userid=$1;', [userID])
            .then(function(r){
            
                var subtotal = 0;
                var itemCount = r.rows[0].items.length;
            
                // Not just the length -- the count, considering the desired quantity
                var itemCountWithQty = 0;
            
            
                for (var i = 0; i < itemCount; i++){
                    
                    var thisItem = r.rows[0].items[i];
//                    console.log("THIS QTY: " + thisItem.qty + ", THIS SALE: " + thisItem.sale);
                    itemCountWithQty += Number(thisItem.qty);
                    subtotal += (Number(thisItem.sale) * Number(thisItem.qty));
                }
                var final = {
                    "user": userID,
                    "count": itemCountWithQty,
                    "subtotal": formatMoneys(subtotal)
                };
                
                res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
                res.end(JSON.stringify(final));

            })
            .catch(console.log);
    }

});

router.get('/orders/export/:id', function(req, res) {
    // Export wishlist to CSV file (HTML page?)
    
    // TO DO:
    // pool.query('SELECT items FROM lists WHERE userid=$1', [userID], function(errSEL, resSEL) {}); 
});

router.get('/orders/export/', function(req, res) {
    // Export ALL wishlists to CSV file (HTML page?)
    
    pool
        .query('SELECT * FROM orders;')
        .then(function(r) {
            
            // CSV with all confirmed orders
            var allOrders = json2csv({ data: r.rows, fields: ['userid', 'firstname', 'email', 'items']});
            fs.writeFile('public/orders/all.csv', allOrders, function(err){
                if (err) throw err;
                console.log('saved');
            });
                    
            // TO DO
            // CSVs with individual orders
            for (i = 0; i < r.rows.length; i++) {
                
                var displayName = r.rows[i].email.split('@')[0];
                var thisOrder = json2csv({ data: r.rows[i].items, fields: ['id', 'parent.prodRgnName', 'shadeOrSize', 'sale', 'parent.largeImage']})
                fs.writeFile('public/orders/' + displayName + '.csv', thisOrder, function(err){
                    if (err) throw err;
                });
            }
            
            fs.readdir('public/orders/', function(err, files){
                res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
                res.end(JSON.stringify(files));
            });
            
            

        }) 
        .catch(console.log);
     
});

