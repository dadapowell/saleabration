var express = require("express"),
	app = express(),
    expressLayouts = require("express-ejs-layouts"),
    pool = require("./app/lib/db"),
	router = require("./app/routes");

var async = require("async");

// use ejs and express layouts
// must come before router
app.set("view engine", "ejs");
app.use(expressLayouts);

// route our app
app.set("port", (process.env.PORT || 8080));
app.use("/", router);

// set directory for static files
app.use(express.static(__dirname + "/public"));


//

// Create db
// user IDs must be unique
/*pool
    .query('CREATE TABLE IF NOT EXISTS orders (userid VARCHAR, firstname VARCHAR, email VARCHAR, items JSON, CONSTRAINT UniquenessSAB PRIMARY KEY (userid));')
    .then(function(res) {
        
        console.log("DB pool created. cool: ", JSON.stringify(res));
    
        
        
    })
    .catch(console.log);*/

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});


// user IDs must be unique
/*pool
    .query('DROP TABLE notis;')
    .then(function() {
        
        console.log("DB pool deleted. cool");
    
        app.listen(app.get('port'), function() {
          console.log('Node app is running on port', app.get('port'));
        });
        
    })
    .catch(console.log);*/