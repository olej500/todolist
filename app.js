require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect(process.env.ATLAS_URL);

const itemSchema = new mongoose.Schema({
  name: String
});
const Item = mongoose.model("Item", itemSchema);
const DefaultItem = mongoose.model("DefaultItem", itemSchema);

const item1 = new DefaultItem({
  name: "Welcome to your to do list"
})
const item2 = new DefaultItem({
  name: "Hit the ➕ button to add an item"
})
const item3 = new DefaultItem({
  name: "⬇️ Click the checkbox to delete an item"
})
const defaultItems = [item1, item2, item3];

DefaultItem.find({}).then(function(foundItems){
  if (foundItems.length === 0){
    DefaultItem.insertMany(defaultItems).then();
  }
})

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});
const List = mongoose.model("List", listSchema);

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const customItem = new Item({
    name: itemName
  });

  if (listName === "Today") {
    customItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}).then(function(foundList){
      foundList.items.push(customItem);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkBox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.deleteOne({_id: checkedItemId}).then();
    res.redirect("/");
  } else {
    List.updateOne({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then()
    res.redirect("/" + listName);
  }
});

app.get("/", function(req, res) {
  Item.find({}).then(function(foundItems){
    DefaultItem.find({}).then(function(foundDefault){
      res.render("list", {listTitle: "Today", listDefaultItems: foundDefault, newListItems: foundItems});
    })
  });
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  
  List.findOne({name: customListName}).then(function(result){
    if (result) {
      DefaultItem.find({}).then(function(foundDefault){
        res.render("list", {listTitle: customListName, listDefaultItems: foundDefault, newListItems: result.items});
      })
    } else {
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    }
  });
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});