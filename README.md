# Sale-a-Bration Endpoints
## Documentation for the Pilot and Wishlist Apps
## Oct 2017

--------
The *Pilot* stack is as follows:
* Node
* Heroku / PostgreSQL
* Stoplight
* Dropsource

The *Wishlist* "stack" is as follows:
* HTML / CSS / JS
* List.js (JS plugin)
* Appcelerator Studio

--------
## Tldr; All the links / documentation
*Main Wiki Page*
* https://dtigwiki.esteeonline.com:8443/display/DTIG/ELC+Sale-a-Bration+Wishlist

*Dashboards*
* Firebase: https://console.firebase.google.com/project/sale-a-bration/authentication/users
* Dropsource: https://app.dropsource.com/workbench/project/893514598823557980/893514598814198533
* Stoplight (database schemas for Dropsource): https://app.stoplight.io
* Heroku (API endpoints): https://saleabration.herokuapp.com (Ferhat and Mehmet are added as collaborators; will transfer ownership TBD)

*Documentation*
* Dropsource / Firebase: https://www.dropsource.com/blog/using-firebase-dropsource-app
* Dropsource / Firebase: https://help.dropsource.com/docs/getting-started/dropsource-faqs/?query=How%20do%20I%20authenticate%20a%20user%20with%20Firebase%3F
* Dropsource (test builds): https://help.dropsource.com/docs/documentation/using-dropsource/testing-your-app/
* API Endpoints: https://dtigwiki.esteeonline.com:8443/download/attachments/4327597/Sale-a-Bration%20API%20Overview.docx
* Postgres / Node: https://devcenter.heroku.com/articles/heroku-postgresql#connecting-in-node-js
* Layers: https://dtigwiki.esteeonline.com:8443/display/DTIG/Layers
* Appcelerator Studio (builds): https://dtigwiki.esteeonline.com:8443/display/DTIG/How+To%3A++Build+Wrapper+Apps+with+Appcelerator
* Appcelerator Studio (packaging): https://dtigwiki.esteeonline.com:8443/display/DTIG/How+To%3A++Package+Apps+with+Appcelerator
* Appcelerator Studio (general): http://docs.appcelerator.com/platform/latest/#!/guide/Titanium_Development

*Repos*
* Sale-a-Bration Endpoints: https://dtigstash.esteeonline.com:8445/projects/SABE/repos/sale-a-bration-endpoints/browse
* Sale-a-Bration (Wishlist): https://dtigstash.esteeonline.com:8445/projects/SAL/repos/sale-a-bration/browse

______
## Managing Users (Pilot only)

### Overview

Most of the interaction with the Firebase API is handled by Dropsource. You can add/remove users from the Firebase console. Currently, we only allow login via email. It is possible to allow users to create accounts, but for the purposes of the pilot, this feature is not included. New users will have to be added manually via the Firebase console.

https://console.firebase.google.com/project/sale-a-bration/authentication/users
* gaddeveloper@gmail.com account has "Owner" level access.

*Documentation*
* https://www.dropsource.com/blog/using-firebase-dropsource-app
* https://help.dropsource.com/docs/getting-started/dropsource-faqs/?query=How%20do%20I%20authenticate%20a%20user%20with%20Firebase%3F

______
## User Database (Pilot only)

### Overview

The Pilot app makes use of several API endpoints that interact with Postgres databases.

*Editor's note: as of the writing of this documenation, the _lists_ database is not being used. The only exception is the /lists/get/:userid endpoint, which is used in Dropsource for data type configuration. Do NOT edit or remove this endpoint from Dropsource.*

Users are managed in two different tables: _lists_ and _orders_. "Lists" is meant to manage users' wishlists, while "orders" is meant for confirmed orders. Each table has the following rows: userid (Firebase uid), firstname, email, and items. The main difference between the tables is that API endpoints for "lists" include things like adding / removing items, returning an item count, updating quantities, etc. -- while API endpoints for "orders" are for confirming and returning orders. Typically, each user's "lists" entry is updated regularly, while their entry in "orders" is only written to once.

Feel free to merge these into a single table over time. They are only separate now because local storage was not fully available. The initial use case was to allow the user to update her wishlist (online only) using the "lists" database and endpoints. Once she was ready to confirm, her "lists" entry would be copied over to the "orders" table. Currently, we are doing a combination of this and Local Storage managed via Dropsource. See below.

### Local Storage

As of the writing of this document, local storage in the Pilot app is managed through the following Dropsource actions:
* Object Exists in Local Array
* Add to Local Array
* Remove from Local Array
* Get Object from Local Array
* Send API Request with Custom Body

Contact Nate at Dropsource (nate@dropsource.com) with any questions.

*Documentation*
* https://devcenter.heroku.com/articles/heroku-postgresql#connecting-in-node-js
* Give admin access to this project in Heroku

______
## Managing Wishlists / Orders (Pilot only)
These endpoints were developed with Node, and are hosted on Heroku. Please check the repo's README file for more information.

### API Endpoints
* https://saleabration.herokuapp.com (Ferhat and Mehmet are added as collaborators; will transfer ownership TBD)
* https://dtigstash.esteeonline.com:8445/projects/SABE/repos/sale-a-bration-endpoints/browse

When it comes to connecting our APIs to Dropsource's front-end tool, we need to define their schemas via Stoplight. We are using the free tier, which only supports 1 unique user.
* https://app.stoplight.io
* Transfer ownership to appropriate user

### API Documentation
* https://dtigwiki.esteeonline.com:8443/download/attachments/4327597/Sale-a-Bration%20API%20Overview.docx

______
## User Database (Wishlist App)

### Overview

The Wishlist app uses local storage exclusively. It currently makes use of one API endpoint: /brand/{brand}, in order to return product lists. It should be possible to hook the Wishlist app into the other API endpoints as needed. See the API documentation for more information.

*Documentation*
* Insert your favorite SQL tutorial link here.
* Please also see the code in main.js for hints / comments

______
## Managing Product Lists (Layers / JSON files / OTA)
### Layers
Layers provides an API for brands' prodcats. Each brand's "layer" must be managed individually -- a tall order, but it can be done!

*Documentation*
* https://dtigwiki.esteeonline.com:8443/display/DTIG/Layers

Where available, there is a sub-layer of the brand's Base Layer, named _BCA Sale-a-bration_. From within this sub-layer, we tag products that will be for sale and, ultimately, visible in the app.

1. Search for the SKU to be added
2. Under "Add New Field", add a field called "collection" and give it a value of "bca". Editor's Note: there is documentation for making actual Collections (capital "C") in Layers, rather than simply tagging; this wasn't available when I first started working with it, but feel free to update this README!
3. Add another field called "sale" -- give this the value of the sale price.

By default, the Layers API will return all of the SKU fields. However, as you will see below, we only need a few of these.

### OTA server files
Certain production files are stored on the OTA server, managed by DTIG: http://ota.esteeonline.com/wishlist
These include:
* JSON files for products not available via API (dir: "manifest/");
* product image files (dir: "images/brand/");
* logo files, to be used as placeholder images;
* download page for development builds;
* backup of the app files (dir: "app/")

JSON files are meant to return SKUs that are discontinued, or otherwise unavailable via API. The template for these JSON files is as follows:

[{
    "shadename": "Coral Gables",
    "productSize": null,
    "formattedPrice": "$28",
    "sale": 0,
    "skuId": "E1000C",
    "parent": {
        "prodRgnName": "Lip Color",
        "largeImage": ["http://www.bobbibrowncosmetics.com/media/export/cms/products/415x415/bb_smoosh_E1000C_415x415_0.jpg"]
        }
    }, { ... }]
-----------
    
The "skuId" property can include the "SKU" portion of the ID (e.g. SKUE1000C) or not (e.g. E1000C) -- it doesn't matter, as long as it is unique. If SKU ID is unavailable (or null), we can use the "path" property from the SKU details.

Also, where possible, use an absolute path for the image ("largeImage").

--------
## Managing Builds (Dropsource)
Editor's Note: at the time of writing this, we are using Dropsource for a pilot, testing our capability to provide a "pre-shopping" feature for Sale-a-Bration customers. As such, all builds have been either web simulator or device builds. We have not yet vetted Dropsource's capability for App / Play Store builds, though this capability is available to us.

*Documentation*
* https://help.dropsource.com/docs/documentation/using-dropsource/testing-your-app/

--------
## Managing Builds (Appcelerator)
There is documentation for this on the Wiki.

*IMPORTANT*: Be sure to check the README file for the Sale-a-Bration repo (separate from the Sale-a-Bration Endpoints repo) for important notes regarding iOS and Android builds in Appcelerator.

*See below*
* Sale-a-Bration README: https://dtigstash.esteeonline.com:8445/projects/SAL/repos/sale-a-bration/browse
* https://dtigwiki.esteeonline.com:8443/display/DTIG/How+To%3A++Build+Wrapper+Apps+with+Appcelerator
* https://dtigwiki.esteeonline.com:8443/display/DTIG/How+To%3A++Package+Apps+with+Appcelerator

*Additional documentation*
* http://docs.appcelerator.com/platform/latest/#!/guide/Titanium_Development

--------
## FAQs

### "User already logged in"

When a user first logs into the Pilot, their record in "orders" is updated with their userid (Firebase uid), firstname, email, and an empty array in items. The "orders" table only allows one entry per email address. So, if a user logs in, deletes the app, re-downloads, and tries to log back in, *they will be locked out*. You can clear this "lockout" by deleting their entry in "orders".

### Mismatched data types (Stoplight / Dropsource)

If you notice that your API requests in Dropsource are failing, or you are getting unexpected values for certain properties, the first step to debugging is usually by checking your data type definitions in Stoplight. Make sure the data types match 1) the data provided by your server, and 2) the expected data type in Dropsource.
