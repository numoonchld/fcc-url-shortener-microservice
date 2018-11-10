'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');
var bodyParser = require('body-parser');
const dns = require('dns');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);

// Make a Schema and Model for storing URLs:
const Schema = mongoose.Schema;

const urlStoreSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      unique: true
    },
    short: Number
  }
);

var ShortURL = mongoose.model('ShortURL', urlStoreSchema);


// Update Model Index:
ShortURL.on('index' ,function(err){
  if (err) throw console.error(err);
  
  // Create a base entry when Collection is empty:   
  // ShortURL.create({ url:"https://www.freecodecamp.com", short: 0 },function(err){
  //   if (err) throw console.error(err);
  // });
  
});

// Load CORS:
app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here:
// before all routes:
app.use(bodyParser.urlencoded({extended:false}));


app.use('/public', express.static(process.cwd() + '/public'));


// serve the index page: 
app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// your first API endpoint:
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

// Respond to Form Input to create/show shortcut to input URL:
app.post("/api/shorturl/new",function(req,res){
  console.clear();
  console.log("post button clicked!~");
  
  // Object with input URL:
  var inputURL = req.body.url;
  
  // // Clean up URL for DNS Lookup:
  // if (inputURL.indexOf("//") != -1) {
  //   inputURL = inputURL.split('//')[1];
  // };
  
  // TEST if input URL == NOT INVALID:
  dns.lookup(inputURL.split('//')[1], function(err, address, family){    
        
    // If DNS lookup says URL is invalid:
    if (err) {
      
        res.json({"error":"invalid URL"});
      
//       res.status(404).send(`<p> Entered URL not found; </p>

//                             <p> Make sure it resembles the example URL; </p>          
                  
//                             <p> Shortcut not created! </p>`);
      // throw (console.error(err));
      
    } 
    // If DNS lookup qualifies URL: 
    else if (address) {
      
      // res.send("Input URL: " +  inputURL);
      // console.log('looked-up ' + inputURL + ", IP address: " + address + " Family: " + family);
           
      // Check if URL already exists in Collection:
      ShortURL.find({ url: inputURL }, function(err,urlDocs){
        
        // console.log(err,urlDocs)
        
        // If URL doesn't exist in Collection: 
        if (urlDocs.length == 0) {
                        
            
            // Find the largest assigned number for short: 
            ShortURL.find({}).sort({ short: "desc"}).limit(1).exec(function(err,data){
              // console.log(data[0].short)
              
              var maxAssignedShortCutNumber = data[0].short;
              

              
              ShortURL.create({url: inputURL, short: maxAssignedShortCutNumber + 1}, function(err,url){
                if (err) throw console.error(err);
              });

              res.json({"original_url": inputURL, "short_url": maxAssignedShortCutNumber + 1});

              

              
            });
          


          }
        // If it exists in collects already: 
        else {          
            res.json({"original_url": urlDocs[0].url, "short_url": urlDocs[0].short })
        };
          
          
      });
        

      
      
      
    }
    
  });

  
});

// Redirect to shortcuts:
app.get("/api/shorturl/:shortcut?",function(req,res){
  
  var inputShortcut = req.params.shortcut;
  
  ShortURL.find({short:inputShortcut},function(req,docArr){
    res.redirect(docArr[0].url);
  });
  
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});