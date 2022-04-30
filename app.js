//jshint esversion:6

//Requirements
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

//App Express
const app = express();

//EJS
app.set('view engine', 'ejs');

//App Use
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Connects to MongoDB using Mongoose
mongoose.connect("mongodb+srv://sevag-admin:Test123@cluster0.ujk9j.mongodb.net/todolistDB", {useNewUrlParser: true});

//Mongoose 'items' Schema
const itemsSchema = {
name: String
}

//Mongoose 'items' Model
const Item = mongoose.model("Item", itemsSchema);

//Database 'items' Documents
const item1 = new Item({
name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
  });

const item3 = new Item({
  name: "<-- Hit this to delete an item."
  });

//default items array
const defaultItems = [item1, item2, item3];


//Mongoose 'list' Schema
const listSchema = {
  name: String,
  items: [itemsSchema]
}

//Mongoose 'list' Model
const List = mongoose.model("List", listSchema);


//GET method home route
app.get("/", function(req, res) {
  //Find items in datbase and render on GET
Item.find({}, function(err, foundItems) {
//insert Default Items to Items collection in DB, only if DB is empty
if (foundItems.length === 0) {
Item.insertMany(defaultItems, function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log("Successfully saved default items to the DB.");
  }
});
  res.redirect("/");
} else {
  res.render("list", {listTitle: "Today", newListItems: foundItems});
}
 });
});

//New Dynamic GET Routes, created by the user
app.get("/:customListName", function(req, res) {
const customListName = _.capitalize(req.params.customListName);
//Looks for existing list name, if doesn't exist create, else render existing list
List.findOne({name: customListName}, function(err, foundList) {
if (!err) {
  if (!foundList) {
//New Database 'list' Document (creates new custom list GET route with default items)
const list = new List({
  name: customListName,
  items: defaultItems
});
list.save();
res.redirect("/" + customListName);
  } else {
  //Render the existing list
  res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

//POST home method route
app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
  name: itemName
});
//If user adds item to "Todays" list
if (listName === "Today"){
  item.save();
  res.redirect("/");
} else { 
//If user adds item to a custom list
  List.findOne({name: listName}, function(err, foundList){
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + listName);
  });
}
});

//POST Delete route
app.post("/delete", function(req, res){
   const checkedItemId = (req.body.checkbox);
   const listName = req.body.listName;
//Deletes item from the home/route route ("Today")
   if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      } 
     });
   } else {
     //Deletes item from the custom list
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err) {
      res.redirect("/" + listName);
    }
    });
  }
 });


//App Listener
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server has started successfully");
});


