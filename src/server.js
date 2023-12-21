const express = require("express");
const router = require("./router/index");
const app = express();
const handlebars = require("express-handlebars");

app.use(express.json());
app.use(express.static(process.cwd() + "/public"));
app.engine("handlebars", handlebars.engine());
app.set("view engine", process.cwd() + "/src/views");
app.set("view engine", "handlebars");

router(app);

module.exports = app;
