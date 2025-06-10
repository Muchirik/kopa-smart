require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/index');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle 404 errors
app.use((req, res) => {
    res.status(404).send('Not Found');
});
// Handle errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Export the app for testing purposes
module.exports = app;