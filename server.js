require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const uri = process.env.MONGODB_URI;
const twelveKey = process.env.TWELVE_DATA_API_KEY;
const client = new MongoClient(uri);
const dbName = "Stock";

app.use(express.static(__dirname + '/stock-ticker-app/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/stock-ticker-app/views/index.html');
});

app.get('/process', async (req, res) => {
  const query = req.query.query;
  const type = req.query.type;

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("PublicCompanies");

    const search = type === 'company'
      ? { company: new RegExp(query, 'i') }
      : { ticker: new RegExp(query, 'i') };

    const results = await collection.find(search).toArray();

    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Search Results</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="window">
    <div class="title-bar">
      <div class="title-bar-text">Search Results</div>
      <div class="title-bar-controls">X</div>
    </div>
    <div class="window-body">
      <div class="results-container">
`;

    if (results.length === 0) {
      html += `<p>No results found.</p>`;
    } else {
      for (const r of results) {
        const ticker = r.ticker.toUpperCase();
        let price = "N/A";

        try {
          const response = await axios.get(
            `https://api.twelvedata.com/price?symbol=${ticker}&apikey=${twelveKey}`
          );
          if (response.data && response.data.price) {
            price = parseFloat(response.data.price).toFixed(2);
          }
        } catch (err) {
          console.error(`Error fetching price for ${ticker}:`, err.message);
        }

        html += `
          <p><strong>${r.company}</strong> (${ticker}): $${price}</p>
        `;
      }
    }

    html += `
        <div class="button-row">
          <a href="/"><button>Go Back</button></a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

    res.send(html);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
