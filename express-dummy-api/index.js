const express = require("express");

const app = express();

app.get("/", (__, res) =>
  setTimeout(() => {
    res.send({
      uptime: process.uptime(),
      message: "Ok",
      date: new Date(),
    });
    // res.status(404).send("not found");
  }, 50)
);

app.listen(3000, () => console.log("Dummy API is up on port 3000"));
