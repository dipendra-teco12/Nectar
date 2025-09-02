const User = require("../Models/user.Model");
const Product = require("../Models/product.Model");
const Order = require("../Models/order.Model");
const PrivacyPolicy = require("../Models/privacyPolicy.Model");

const getUserList = async (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get search parameter for DataTables
    const searchValue = req.query.search?.value || "";

    // Build search query
    let searchQuery = {};
    if (searchValue) {
      searchQuery = {
        $or: [
          { fullName: { $regex: searchValue, $options: "i" } },
          { email: { $regex: searchValue, $options: "i" } },
          { role: { $regex: searchValue, $options: "i" } },
        ],
      };
    }

    // Get total count for pagination
    const totalUsers = await User.countDocuments(searchQuery);

    // Get users with pagination
    const userData = await User.find(
      searchQuery,
      "fullName email role isDeleted createdAt"
    )
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);

    if (!userData || userData.length === 0) {
      return res.status(404).json({
        message: "Users not found",
        data: [],
        recordsTotal: 0,
        recordsFiltered: 0,
      });
    }

    // Format data for DataTables
    const formattedData = userData.map((user) => ({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isDeleted ? "Inactive" : "Active",
      status: user.isDeleted
        ? '<span class="badge badge-danger">Inactive</span>'
        : '<span class="badge badge-success">Active</span>',
    }));

    res.status(200).json({
      message: "Users found successfully",
      data: formattedData,
      recordsTotal: totalUsers,
      recordsFiltered: totalUsers, // For search functionality
      draw: parseInt(req.query.draw) || 1, // For DataTables
    });
  } catch (error) {
    console.error("Error While getting users", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllProduct = async (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get search parameter for DataTables
    const searchValue = req.query.search?.value || "";

    // Build search query
    let searchQuery = {};
    if (searchValue) {
      searchQuery = {
        $or: [
          { productName: { $regex: searchValue, $options: "i" } },
          // Add other searchable fields if needed
        ],
      };
    }

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(searchQuery);

    // Get products with pagination
    const allProduct = await Product.find(
      searchQuery,
      "productName image price stock createdAt"
    )
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);

    if (!allProduct || allProduct.length === 0) {
      return res.status(200).json({
        message: "No products found",
        data: [],
        recordsTotal: 0,
        recordsFiltered: 0,
        draw: parseInt(req.query.draw) || 1,
      });
    }

    // Format data for DataTables
    const formattedData = allProduct.map((product) => ({
      productName: product.productName,
      image: product.image || "/images/no-image.png", // Default image if none
      price: parseFloat(product.price).toFixed(2),
      stock: product.stock,
      id: product._id,
    }));

    res.status(200).json({
      message: "All products found successfully",
      data: formattedData,
      recordsTotal: totalProducts,
      recordsFiltered: totalProducts,
      draw: parseInt(req.query.draw) || 1,
    });
  } catch (error) {
    console.error("Error while getting all products", error);
    res.status(500).json({
      message: "Internal Server Error",
      data: [],
      recordsTotal: 0,
      recordsFiltered: 0,
    });
  }
};

const getOrders = async (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get search parameter for DataTables
    const searchValue = req.query.search?.value || "";

    // Get status filter (optional)
    const status = req.query.status || "all";

    // Build search and filter query
    let query = {};

    // If this is for admin panel, remove userId filter
    // For user-specific orders, keep the userId filter
    // const userId = req.user?._id; // Uncomment if user-specific
    // if (userId) query.userId = userId;

    // Status filter
    if (status !== "all") {
      query.status = status;
    }

    // Search functionality
    if (searchValue) {
      // We'll search in populated user data, so we need aggregation
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
            ...query,
            $or: [
              { "user.fullName": { $regex: searchValue, $options: "i" } },
              { "user.email": { $regex: searchValue, $options: "i" } },
              { address: { $regex: searchValue, $options: "i" } },
              { status: { $regex: searchValue, $options: "i" } },
            ],
          },
        },
        {
          $sort: { date: -1 },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
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

      const orders = await Order.aggregate(searchQuery);
      const totalCountQuery = [...searchQuery];
      totalCountQuery.splice(-3, 3); // Remove skip, limit, project
      totalCountQuery.push({ $count: "total" });
      const totalResult = await Order.aggregate(totalCountQuery);
      const totalOrders = totalResult[0]?.total || 0;

      // Format data for DataTables
      const formattedData = orders.map((order) => ({
        id: order._id,
        userName: order.userId.fullName,
        email: order.userId.email,
        address: order.address,
        quantity: order.Products.reduce(
          (total, product) => total + product.quantity,
          0
        ),
        totalAmount: order.subtotal,
        status: order.status,
        date: order.date,
        products: order.Products,
      }));

      return res.status(200).json({
        message: "Orders found successfully",
        data: formattedData,
        recordsTotal: totalOrders,
        recordsFiltered: totalOrders,
        draw: parseInt(req.query.draw) || 1,
      });
    }

    // Regular query without search
    const totalOrders = await Order.countDocuments(query);

    const orders = await Order.find(query, "-location")
      .populate("userId", "fullName email")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    if (orders.length === 0) {
      return res.status(200).json({
        message: "No orders found",
        data: [],
        recordsTotal: 0,
        recordsFiltered: 0,
        draw: parseInt(req.query.draw) || 1,
      });
    }

    // Format data for DataTables
    const formattedData = orders.map((order) => ({
      id: order._id,
      userName: order.userId.fullName,
      email: order.userId.email,
      address: order.address,
      quantity: order.Products.reduce(
        (total, product) => total + product.quantity,
        0
      ),
      totalAmount: order.subtotal,
      status: order.status,
      date: order.date,
      products: order.Products,
    }));

    res.status(200).json({
      message: "Orders found successfully",
      data: formattedData,
      recordsTotal: totalOrders,
      recordsFiltered: totalOrders,
      draw: parseInt(req.query.draw) || 1,
    });
  } catch (error) {
    console.error("Error while getting orders:", error);
    res.status(500).json({
      message: "Internal Server Error",
      data: [],
      recordsTotal: 0,
      recordsFiltered: 0,
    });
  }
};

const privacy_policy = async (req, res) => {
  try {
    const policy = await PrivacyPolicy.findOne();
    res.json({ policy: policy || { html: "" } });
  } catch (error) {
    res.status(500).json({ message: "Error loading privacy policy" });
  }
};

const save_privacy = async (req, res) => {
  try {
    const { html } = req.body;

    await PrivacyPolicy.findOneAndUpdate({}, { html }, { upsert: true });
    res.json({ message: "Privacy policy saved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error saving privacy policy" });
  }
};
module.exports = {
  getUserList,
  getAllProduct,
  getOrders,
  privacy_policy,
  save_privacy,
};
