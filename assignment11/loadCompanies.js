const fs = require('fs');
const readline = require('readline');
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://admin:leann200467@cluster0.kilebqt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
const dbName = "Stock";

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const db = client.db(dbName);
    const collection = db.collection("PublicCompanies");

    const fileStream = fs.createReadStream('companies.csv');
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      console.log("Read line:", line);
      const [company, ticker, price] = line.split(',');

      if (company && ticker && price) {
        const doc = {
          company: company.trim(),
          ticker: ticker.trim(),
          price: parseFloat(price.trim())
        };

        await collection.insertOne(doc);
        console.log("Inserted:", doc);
      }
    }

    console.log("All records inserted!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("Connection closed.");
  }
}

run();
