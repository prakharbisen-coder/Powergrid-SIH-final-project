const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/powergridDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Define schema
const powerSchema = new mongoose.Schema({}, { strict: false });
const PowerModel = mongoose.model("PowerGrid", powerSchema);

// Read CSV and insert
let dataArray = [];

fs.createReadStream("powergrid_large_dataset.csv")
  .pipe(csv())
  .on("data", (row) => {
    dataArray.push(row);   // push each row
  })
  .on("end", async () => {
    try {
      await PowerModel.insertMany(dataArray);  // insert all rows
      console.log("✔ All data inserted successfully!");
      process.exit();
    } catch (err) {
      console.error("Error inserting data:", err);
    }
  });
