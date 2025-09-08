const User = require("../Models/user.Model");
const Product = require("../Models/product.Model");
const Order = require("../Models/order.Model");
const PrivacyPolicy = require("../Models/privacyPolicy.Model");
const Category = require("../Models/category.Model");

const getAllProduct = async (req, res) => {
  try {
    // Get DataTables parameters
    const draw = parseInt(req.query.draw) || 1;
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;

    // Get search parameter - handle both formats
    const searchValue = req.query.search?.value || req.query.search || "";

    // Get sorting parameters
    const orderColumn = parseInt(req.query.order_column) || 0;
    const orderDir = req.query.order_dir || "asc";

    // Column mapping for sorting
    const columns = ["productName", "image", "price", "stock"];
    const sortField = columns[orderColumn] || "productName";
    const sortOrder = orderDir === "desc" ? -1 : 1;

    // Build search query
    let searchQuery = {};
    if (searchValue && searchValue.trim() !== "") {
      searchQuery = {
        $or: [
          { productName: { $regex: searchValue.trim(), $options: "i" } },
          // Add price search (convert search to number if it's numeric)
          ...(!isNaN(parseFloat(searchValue))
            ? [{ price: parseFloat(searchValue) }]
            : []),
          // Add stock search (convert search to number if it's numeric)
          ...(!isNaN(parseInt(searchValue))
            ? [{ stock: parseInt(searchValue) }]
            : []),
        ],
      };
    }

    // Get total count (without search filter)
    const totalProducts = await Product.countDocuments({});

    // Get filtered count (with search filter)
    const filteredProducts = await Product.countDocuments(searchQuery);

    // Build sort object
    let sortObject = {};
    if (sortField === "price" || sortField === "stock") {
      // For numeric fields, ensure proper sorting
      sortObject[sortField] = sortOrder;
    } else if (sortField === "productName") {
      // For text fields, case-insensitive sorting
      sortObject[sortField] = sortOrder;
    } else {
      // Default sort
      sortObject["createdAt"] = -1;
    }

    // Get products with search, sorting, and pagination
    const allProduct = await Product.find(
      searchQuery,
      "productName image price stock createdAt"
    )
      .sort(sortObject)
      .skip(start)
      .limit(length)
      .lean(); // Use lean() for better performance

    // Format data for DataTables
    const formattedData = allProduct.map((product) => ({
      productName: product.productName || "N/A",
      image: product.image || "/images/no-image.png",
      price: product.price ? parseFloat(product.price).toFixed(2) : "0.00",
      stock: product.stock || 0,
      id: product._id.toString(),
    }));

    // DataTables response format
    const response = {
      draw: draw,
      recordsTotal: totalProducts,
      recordsFiltered: filteredProducts,
      data: formattedData,
      // Additional debug info (remove in production)
      debug: {
        searchValue,
        sortField,
        sortOrder: orderDir,
        totalFound: allProduct.length,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error while getting all products:", error);
    res.status(500).json({
      draw: parseInt(req.query.draw) || 1,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
      error: error.message,
    });
  }
};

const getOrders = async (req, res) => {
  try {
    // Get DataTables parameters
    const draw = parseInt(req.query.draw) || 1;
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;

    // Get search parameter - handle both formats
    const searchValue = req.query.search?.value || req.query.search || "";

    // Get sorting parameters
    const orderColumn = parseInt(req.query.order_column) || 6; // Default to date column
    const orderDir = req.query.order_dir || "desc";

    // Get status filter
    const status = req.query.status || "all";

    // Column mapping for sorting
    const columns = [
      "_id",
      "userId.fullName",
      "address",
      "totalItems",
      "subtotal",
      "status",
      "date",
      "actions",
    ];
    const sortField = columns[orderColumn] || "date";
    const sortOrder = orderDir === "desc" ? -1 : 1;

    // Build base query
    let baseQuery = {};

    // Status filter
    if (status !== "all") {
      baseQuery.status = status;
    }

    let totalOrders, filteredOrders, orders;

    if (searchValue && searchValue.trim() !== "") {
      // Search with aggregation pipeline
      const searchQuery = [
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $match: {
            ...baseQuery,
            $or: [
              {
                "user.fullName": { $regex: searchValue.trim(), $options: "i" },
              },
              { "user.email": { $regex: searchValue.trim(), $options: "i" } },
              { address: { $regex: searchValue.trim(), $options: "i" } },
              { status: { $regex: searchValue.trim(), $options: "i" } },
              // Add numeric search for amount if searchValue is numeric
              ...(!isNaN(parseFloat(searchValue))
                ? [{ subtotal: parseFloat(searchValue) }]
                : []),
            ],
          },
        },
      ];

      // Get total count without search
      totalOrders = await Order.countDocuments(baseQuery);

      // Get filtered count with search
      const filteredCountQuery = [...searchQuery, { $count: "total" }];
      const filteredResult = await Order.aggregate(filteredCountQuery);
      filteredOrders = filteredResult[0]?.total || 0;

      // Build sort object for aggregation
      let sortObject = {};
      if (sortField.includes(".")) {
        // For nested fields like userId.fullName
        if (sortField === "userId.fullName") {
          sortObject["user.fullName"] = sortOrder;
        }
      } else {
        sortObject[sortField] = sortOrder;
      }

      // Get paginated results with search
      const paginatedQuery = [
        ...searchQuery,
        { $sort: sortObject },
        { $skip: start },
        { $limit: length },
        {
          $project: {
            userId: {
              _id: "$user._id",
              fullName: "$user.fullName",
              email: "$user.email",
            },
            Products: 1,
            status: 1,
            address: 1,
            subtotal: 1,
            date: 1,
          },
        },
      ];

      orders = await Order.aggregate(paginatedQuery);
    } else {
      // Regular query without search
      totalOrders = await Order.countDocuments(baseQuery);
      filteredOrders = totalOrders;

      // Build sort object for regular query
      let sortObject = {};
      if (sortField === "userId.fullName") {
        // For populated fields, we'll sort after population
        sortObject = { date: sortOrder }; // Fallback to date sorting
      } else {
        sortObject[sortField] = sortOrder;
      }

      const queryOrders = await Order.find(baseQuery, "-location")
        .populate("userId", "fullName email")
        .sort(sortObject)
        .skip(start)
        .limit(length)
        .lean();

      // Convert to consistent format
      orders = queryOrders.map((order) => ({
        _id: order._id,
        userId: {
          _id: order.userId._id,
          fullName: order.userId.fullName,
          email: order.userId.email,
        },
        Products: order.Products,
        status: order.status,
        address: order.address,
        subtotal: order.subtotal,
        date: order.date,
      }));

      // Sort by user name if needed (post-processing)
      if (sortField === "userId.fullName") {
        orders.sort((a, b) => {
          const nameA = a.userId.fullName.toLowerCase();
          const nameB = b.userId.fullName.toLowerCase();
          return sortOrder === 1
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        });
      }
    }

    if (orders.length === 0) {
      return res.status(200).json({
        draw: draw,
        recordsTotal: totalOrders,
        recordsFiltered: filteredOrders,
        data: [],
        message: "No orders found",
      });
    }

    // Format data for DataTables
    const formattedData = orders.map((order) => ({
      id: order._id.toString(),
      userName: order.userId.fullName || "N/A",
      email: order.userId.email || "N/A",
      address: order.address || "N/A",
      quantity: order.Products
        ? order.Products.reduce(
            (total, product) => total + (product.quantity || 0),
            0
          )
        : 0,
      totalAmount: order.subtotal
        ? parseFloat(order.subtotal).toFixed(2)
        : "0.00",
      status: order.status || "Pending",
      date: order.date || new Date(),
      products: order.Products || [],
    }));

    const response = {
      draw: draw,
      recordsTotal: totalOrders,
      recordsFiltered: filteredOrders,
      data: formattedData,
      // Debug info (remove in production)
      debug: {
        searchValue,
        status,
        sortField,
        sortOrder: orderDir,
        totalFound: orders.length,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error while getting orders:", error);
    res.status(500).json({
      draw: parseInt(req.query.draw) || 1,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
      error: error.message,
    });
  }
};

const privacy_policy = async (req, res) => {
  try {
    const policy = await PrivacyPolicy.findOne();
    res.json({ success: true, policy: policy || { html: "" } });
  } catch (error) {
    res.status(500).json({ message: "Error loading privacy policy" });
  }
};

const save_privacy = async (req, res) => {
  try {
    const { html } = req.body;

    await PrivacyPolicy.findOneAndUpdate({}, { html }, { upsert: true });
    res.json({ success: true, message: "Privacy policy saved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error saving privacy policy" });
  }
};

const dashboardCount = async (req, res) => {
  try {
    const NewOrder = await Order.countDocuments({ status: "Pending" });
    const Delivered = await Order.countDocuments({ status: "Delivered" });
    const ActiveUser = await User.countDocuments();

    const ProductCount = await Product.countDocuments();
    const CategoryCount = await Category.countDocuments();
    const PendingOrders = await Order.countDocuments({ status: "Pending" });

    // Low stock products (assuming stock < 10 is low)
    const LowStockCount = await Product.countDocuments({ stock: { $lt: 10 } });

    // Calculate total revenue (from delivered orders)
    const revenueResult = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $group: { _id: null, totalRevenue: { $sum: "$subtotal" } } },
    ]);
    const TotalRevenue = revenueResult[0]?.totalRevenue || 0;

    const data = {
      orderCount: NewOrder,
      deliveredCount: Delivered,
      activeUser: ActiveUser,
      productCount: ProductCount,
      categoryCount: CategoryCount,
      pendingOrders: PendingOrders,
      lowStockCount: LowStockCount,
      totalRevenue: TotalRevenue,
    };

    res.status(200).json({
      success: true,
      message: "Dashboard Count Fetched Successfully",
      data,
    });
  } catch (error) {
    console.error("Error While Getting Dashboard count:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Recent Orders API
// const getRecentOrders = async (req, res) => {
//   try {
//     const recentOrders = await Order.find({})
//       .populate("userId", "fullName email")
//       .sort({ date: -1 })
//       .limit(5)
//       .lean();

//     const formattedOrders = recentOrders.map((order) => ({
//       id: order._id,
//       customerName: order.userId.fullName,
//       amount: order.subtotal,
//       status: order.status,
//       date: order.date,
//     }));

//     res
//       .status(200)
//       .json({
//         success: true,
//         message: "Recent orders fetched successfully",
//         data: formattedOrders,
//       });
//   } catch (error) {
//     console.error("Error fetching recent orders:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

module.exports = {
  getAllProduct,
  getOrders,
  privacy_policy,
  save_privacy,
  dashboardCount,
};
