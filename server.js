require("dotenv").config();
const express = require("express");

const app = express();

app.use(express.json());

const urlRouter = require("./src/routes");

app.use("/url-shortener", urlRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server is listening on port ", PORT);
})