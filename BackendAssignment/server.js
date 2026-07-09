const express = require("express");

const app = express();
const PORT = 3000;

app.use(express.json());

// Endpoint 1
app.get("/", (req, res) => {
    res.json({
        message: "Hello, World!"
    });
});

// Endpoint 2
app.get("/about", (req, res) => {
    res.json({
        name: "Yash",
        course: "Computer Science",
        message: "My first backend server!"
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});