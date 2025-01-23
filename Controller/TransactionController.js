import { Transaction } from "../model/TransactionModel.js.js";
import axios from "axios";
export const seedDatabase = async (req, res) => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );

    const products = response.data;
    const formattedProducts = products.map((product) => ({
      ...product,
      dateOfSale: new Date(product.dateOfSale), // Ensure date format
    }));
    await Transaction.insertMany(formattedProducts);

    return res
      .status(200)
      .json({ message: "Database seeded successfully", success: true });
  } catch (error) {
    res.status(500).json({ message: "Error seeding database", error });
  }
};
// For Transaction Table
export const getTransaction = async (req, res) => {
  try {
    const { search, page = 1, perPage = 10 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { price: { $regex: search.toString(), $options: "i" } },
      ];
    }
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .skip((page - 1) * perPage)
      .limit(parseInt(perPage));
    return res.status(200).json({
      total,
      page: parseInt(page),
      perPage: parseInt(perPage),
      transactions,
    });
  } catch (error) {
    console.log(error);
  }
};
// For statistics

export const monthlyTransaction = async (req, res) => {
  const { month } = req.query;
  if (!month) {
    return res.status(400).json({
      success: false,
      message: " and month must be provided",
    });
  }

  // console.log(`getMonthlyStatistics called with month: ${month}`);
  // console.log(`Date range: ${startDate} to ${endDate}`);

  try {
    // Calculate total sale amount and total number of sold items

    // console.log('Match criteria for sold items:', matchCriteria);
    const totalSales = await Transaction.aggregate([
      {
        $addFields: {
          month: { $month: "$dateOfSale" },
        },
      },
      {
        $match: {
          sold: true,
          month: parseInt(month, 10),
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$price" },
          totalSoldItems: { $sum: 1 },
        },
      },
    ]);
    const totalNotSoldItems = await Transaction.aggregate([
      {
        $addFields: {
          month: { $month: "$dateOfSale" },
        },
      },
      {
        $match: {
          month: parseInt(month, 10),
          sold: false,
        },
      },
      {
        $group: {
          _id: null,
          totalNotSoldItems: { $sum: 1 },
        },
      },
    ]);
    console.log("totalSales result:", totalSales);

    console.log("totalNotSoldItems result:", totalNotSoldItems);

    const statistics = {
      totalSaleAmount: Math.round(totalSales[0]?.totalAmount || 0),
      totalSoldItems: totalSales[0]?.totalSoldItems || 0,
      totalNotSoldItems: totalNotSoldItems,
    };

    return statistics;
  } catch (error) {
    console.error("Error in getMonthlyStatistics:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};

// For bar graph
export const priceRangeOfItems = async (req, res) => {
  const { month, minPrice, maxPrice } = req.query;
  if (!month) {
    return res.status(201).json({
      success: false,
      message: "Month must be provided",
    });
  }

  const min = parseInt(minPrice, 10) || 0;
  const max = parseInt(maxPrice, 10) || 10000;
  try {
    const priceRange = await Transaction.aggregate([
      {
        $addFields: {
          month: { $month: "$dateOfSale" },
        },
      },
      {
        $match: {
          month: parseInt(month, 10),
          price: { $gte: min, $lte: max },
        },
      },
      {
        $bucket: {
          groupBy: "$price",
          boundaries: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 10000],
          default: "other",
          output: {
            count: { $sum: 1 },
          },
        },
      },
      {
        $addFields: {
          priceRange: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", "other"] }, then: "1000+" },
                { case: { $lt: ["$_id", 100] }, then: "0-100" },
                { case: { $lt: ["$_id", 200] }, then: "101-200" },
                { case: { $lt: ["$_id", 300] }, then: "201-300" },
                { case: { $lt: ["$_id", 400] }, then: "301-400" },
                { case: { $lt: ["$_id", 500] }, then: "401-500" },
                { case: { $lt: ["$_id", 600] }, then: "501-600" },
                { case: { $lt: ["$_id", 700] }, then: "601-700" },
                { case: { $lt: ["$_id", 800] }, then: "701-800" },
                { case: { $lt: ["$_id", 900] }, then: "801-900" },
                { case: { $lt: ["$_id", 10000] }, then: "901-10000" },
              ],
              default: "other",
            },
          },
        },
      },
    ]);

    console.log("Aggregated Price Range Data:", priceRange); // Add this line for debugging

    const response = priceRange.map((item) => ({
      range: Math.floor(item._id),
      count: item.count,
    }));
    return response;
  } catch (error) {
    console.log(error);
  }
};

// For pie Chart
export const catagoriesOfItems = async (req) => {
  const { month } = req.query;
  if (!month) {
    return res.status(201).json({
      success: false,
      message: "Dates must be provided",
    });
  }
  // const startMonth = new Date(Date.UTC(2000, month - 1, 1));
  // const endMonth = new Date(Date.UTC(2000, month, 0, 23, 59, 59));
  // const min = parseInt(minPrice, 10) || 0;
  // const max = parseInt(maxPrice, 10) || 10000;
  try {
    const categories = await Transaction.aggregate([
      {
        $addFields: {
          month: { $month: "$dateOfSale" },
        },
      },
      {
        $match: {
          month: parseInt(month, 10),
        },
      },
      {
        $group: {
          _id: "$category",
          itemsCount: { $sum: 1 },
        },
      },
    ]);

    const response = categories.map((item) => ({
      category: item._id,
      count: item.itemsCount,
    }));
    console.log(categories);
    return response;
  } catch (error) {
    console.log(error);
  }
};

// export const testWithoutDateRange = async (req, res) => {
//   try {

//     const soldItems = await Transaction.find({ sold: true });
//     console.log('Sold items:', soldItems);
//     return res.status(200).json({
//       success: true,
//       data: soldItems
//     });
//   } catch (error) {
//     console.error('Error in testWithoutDateRange:', error);
//     res.status(500).json({ message: 'Server Error', error });
//   }
// };

// export const testDateRangeOnly = async (req, res) => {
//   const { month } = req.query;
//   const startDate = new Date(Date.UTC(, month - 1, 1));
//   const endDate = new Date(Date.UTC(, month, 0, 23, 59, 59));

//   console.log(`testDateRangeOnly called with : ${}, month: ${month}`);
//   console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

//   try {
//     const itemsInDateRange = await Transaction.find({
//       dateOfSale: { $gte: startDate, $lte: endDate }
//     });
//     console.log('Items with date range:', itemsInDateRange);
//     return res.status(200).json({
//       success: true,
//       data: itemsInDateRange
//     });
//   } catch (error) {
//     console.error('Error in testDateRangeOnly:', error);
//     res.status(500).json({ message: 'Server Error', error });
//   }
// };
// export const testSimpleDateQuery = async (req, res) => {
//   const { month } = req.query;
//   const startDate = new Date(Date.UTC(, month - 1, 1));
//   const endDate = new Date(Date.UTC(, month, 0, 23, 59, 59));

//   console.log(`testSimpleDateQuery called with : ${}, month: ${month}`);
//   console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

//   try {
//     const itemsInDateRange = await Transaction.find({})
//     console.log('Items with date range:', itemsInDateRange);
//     return res.status(200).json({
//       success: true,
//       data: itemsInDateRange
//     });
//   } catch (error) {
//     console.error('Error in testSimpleDateQuery:', error);
//     res.status(500).json({ message: 'Server Error', error });
//   }
// };
