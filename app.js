//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://vivekanjana76:${process.env.ATLAS_PASSWORD}@cluster0.cclqxse.mongodb.net/todolistDB');

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", async function(req, res) { // Add 'async' here

  try {
    const foundItems = await Item.find({});

    if (foundItems.length === 0) {
      (async () => {
        try {
          await Item.insertMany(defaultItems);
          console.log("Successfully saved default items.");
          res.redirect("/");
        } catch (err) {
          console.error("Error saving default items:", err);
        }
      })();
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
    } catch (err) {
    console.error("Error finding items:", err);
  }

});


app.get("/:customListName", async function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName });
    if (!foundList) {
      //Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
    
      list.save();
      res.redirect("/" + customListName);
    } else {
      //show an existing list

      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});

    }
  } catch (err) {
    console.error("Error finding list:", err);
  }
  

 

});


app.post("/", async function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name : itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    try {
      const foundList = await List.findOne({ name: listName });
      if (foundList) {
        foundList.items.push(item);
        await foundList.save();
        res.redirect("/" + listName);
      } else {
        console.log("List not found!");
        // Handle the case when the list is not found.
        // You can send an appropriate response or redirect as needed.
      }
    } catch (err) {
      console.error("Error updating and saving list:", err);
      // Handle the error as needed.
    }
    
  }
});

app.post("/delete", async function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    try {
      const result = await Item.findByIdAndRemove(checkedItemId);
      if (result) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      } else {
        console.log("No item found to delete.");
      }
    } catch (err) {
      console.error("Error deleting checked item:", err);
    }
  } else {
    try {
      const foundList = await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
    
      if (foundList) {
        res.redirect("/" + listName);
      } else {
        console.log("List not found!");
        // Handle the case when the list is not found.
        // You can send an appropriate response or redirect as needed.
      }
    } catch (err) {
      console.error("Error updating list:", err);
      // Handle the error as needed.
    }
  }
});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
