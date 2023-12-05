const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
module.exports = app;

const dbPath = path.join(__dirname, "products.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(4000, () => {
      console.log("Server Running Successfully at http://localhost:3001");
    });
  } catch (e) {
    console.log(`Error ${e}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API 1
app.get("/home/", async (request, response) => {
  const { search = "", page_no = 1, month } = request.query;

  limit = parseInt(page_no) * 10;
  offset = limit - 10;

  let getResponseQuery = `
        SELECT * 
        FROM product
        WHERE (CAST(strftime("%m", date_of_sale) as INT)=${month})
        AND (price LIKE '%${search}%' OR descriptions LIKE '%${search}%' OR title LIKE '%${search}%')
        LIMIT ${limit}
        OFFSET ${offset}
        `;

  const responseData = await db.all(getResponseQuery);
  console.log(responseData);
  response.send(
    responseData.map((item) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      description: item.description,
      category: item.category,
      image: item.image,
      dateOfSale: item.date_of_sale,
      sold: item.sold,
    }))
  );
});

//API 2
app.get("/home/stats/", async (request, response) => {
  const { month } = request.query;

  const getSaleQuery = `
  SELECT SUM(price) as total_price
  FROM product
  WHERE CAST(strftime("%m", date_of_sale) as INT)=${month};`;
  const salesResponse = await db.get(getSaleQuery);

  const getSoldQuery = `
  SELECT COUNT() as total_sold_items
  FROM product 
  WHERE sold = ${true} AND 
  CAST(strftime("%m", date_of_sale) as INT)=${month}`;
  const soldResponse = await db.get(getSoldQuery);

  const getNotSoldQuery = `
  SELECT COUNT() as total_not_sold_items
  FROM product 
  WHERE sold =${false} AND 
  CAST(strftime("%m", date_of_sale) as INT)=${month}`;
  const notSoldResponse = await db.get(getNotSoldQuery);
  response.send({
    totalPrice: salesResponse.total_price,
    totalSoldItems: soldResponse.total_sold_items,
    totalNotSoldItems: notSoldResponse.total_not_sold_items,
  });
});

//API 3
app.get("/home/barchart/", async (request, response) => {
  const { month } = request.query;
  const getBarChartQuery1 = `
        SELECT
            COUNT() as total_items,
            CASE
                WHEN price >= 0
                AND price < 100 THEN '0-100'
                WHEN price >= 101
                AND price < 200 THEN '101-200'
                WHEN price >= 201
                AND price < 300 THEN '201-300'
                WHEN price >= 301
                AND price < 400 THEN '301-400'
                WHEN price >= 401
                AND price < 500 THEN '401-500'
                WHEN price >= 501
                AND price < 600 THEN '501-600'
                WHEN price >= 601
                AND price < 700 THEN '601-700'
                WHEN price >= 701
                AND price < 800 THEN '701-800'
                WHEN price >= 801
                AND price < 900 THEN '801-900'
                Else '900 and above'
            END AS price_range
        FROM product
        WHERE CAST(strftime("%m", date_of_sale) as INT)=${month}
        GROUP BY price_range;`;
  const responseData = await db.all(getBarChartQuery1);
  response.send(
    responseData.map((item) => ({
      priceRange: item.price_range,
      totalPriceRangeItems: item.total_items,
    }))
  );
});

//API 4
app.get("/home/piechart/", async (request, response) => {
  const { month } = request.query;
  const getPieChartQuery = `
  SELECT DISTINCT category,
  COUNT() as total_items
  FROM product 
  WHERE CAST(strftime("%m", date_of_sale) as INT)=${month}
  GROUP BY category;`;
  const responseData = await db.all(getPieChartQuery);
  response.send(
    responseData.map((item) => ({
      category: item.category,
      totalCategoryItems: item.total_items,
    }))
  );
});

//API 5
app.get("/home/response", async (request, response) => {
  const { month } = request.query;

  const getSaleQuery = `
  SELECT SUM(price) as total_price
  FROM product 
  WHERE CAST(strftime("%m", date_of_sale) as INT)=${month};`;
  const salesResponse = await db.get(getSaleQuery);

  const getSoldQuery = `
  SELECT COUNT() as total_sold_items
  FROM product 
  WHERE sold = ${true} AND 
  CAST(strftime("%m", date_of_sale) as INT)=${month}`;
  const soldResponse = await db.get(getSoldQuery);

  const getNotSoldQuery = `
  SELECT COUNT() as total_not_sold_items
  FROM product 
  WHERE sold =${false} AND 
  CAST(strftime("%m", date_of_sale) as INT)=${month}`;
  const notSoldResponse = await db.get(getNotSoldQuery);

  const getPriceRangeQuery = `
        SELECT
            COUNT() as total_items,
            CASE
                WHEN price >= 0
                AND price < 100 THEN '0-100'
                WHEN price >= 101
                AND price < 200 THEN '101-200'
                WHEN price >= 201
                AND price < 300 THEN '201-300'
                WHEN price >= 301
                AND price < 400 THEN '301-400'
                WHEN price >= 401
                AND price < 500 THEN '401-500'
                WHEN price >= 501
                AND price < 600 THEN '501-600'
                WHEN price >= 601
                AND price < 700 THEN '601-700'
                WHEN price >= 701
                AND price < 800 THEN '701-800'
                WHEN price >= 801
                AND price < 900 THEN '801-900'
                Else '900 and above'
            END AS price_range
        FROM product
        WHERE CAST(strftime("%m", date_of_sale) as INT)=${month}
        GROUP BY price_range;`;
  const priceRangeResponse = await db.all(getPriceRangeQuery);

  const priceRangeData = priceRangeResponse.map((item) => ({
    priceRange: item.price_range,
    totalPriceRangeItems: item.total_items,
  }));

  const getCategoryQuery = `
  SELECT DISTINCT category,
  COUNT() as total_items
  FROM product 
  WHERE CAST(strftime("%m", date_of_sale) as INT)=${month}
  GROUP BY category;`;
  const categoryResponse = await db.all(getCategoryQuery);
  const categoryData = categoryResponse.map((item) => ({
    category: item.category,
    totalCategoryItems: item.total_items,
  }));

  response.send({
    statistics: {
      totalPrice: salesResponse.total_price,
      totalSoldItems: soldResponse.total_sold_items,
      totalNotSoldItems: notSoldResponse.total_not_sold_items,
    },
    priceRange: priceRangeData,
    category: categoryData,
  });
});
