const Order = require("../Models/order.Model");
const Category = require("../Models/category.Model");

const FavouriteProduct = require("../Models/fevouriteProducts.Model");
const Product = require("../Models/product.Model");
const Cart = require("../Models/cart.Model");
const setProduct = async (req, res) => {
  try {
    const { productName, price, category, stock, description } = req.body;

    if (!productName || !price || !category || !description || !stock) {
      return res.status(400).json({ message: "All fields required" });
    }

    const imageUrl = req.file?.path || null;
    const imagePublicId = req.file?.filename || null;

    const product = await Product.create({
      productName,
      price,
      stock,
      description,
      image: imageUrl,
      imagePublicId,
      category,
    });

    let category_data = await Category.findOne({ category });
    if (!category_data) {
      category_data = await Category.create({ category });
    }
    category_data.categoryProduct.push(product._id);
    await category_data.save();

    res.status(201).json({
      message: "Product successfully uploaded",
      product,
    });
  } catch (error) {
    console.error("Error while uploading product:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    const product = await Product.findById({ _id: productId });
    if (!product) {
      return res.status(404).json({ message: "Product Not Found" });
    }
    const data = {
      productName: product.productName,
      stock: product.stock,
      image: product.image,
      description: product.description,
      price: product.price,
      category: product.category,
    };
    res.status(200).json({ message: "Product Successfully Fetched", data });
  } catch (error) {
    console.error("Error While Getting Product Details :", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    const product = await Product.findByIdAndDelete({ _id: productId });
    if (!product) {
      return res
        .status(404)
        .json({ message: "Product NoT Found or Already Deleted" });
    }
    const category = await Category.findOne({ category: product.category });
    if (category) {
      category.categoryProduct.pull(productId);
    }

    await category.save();

    res.status(200).json({ message: "Product Successfully Deleted" });
  } catch (error) {
    console.error("Error While Deleting Product Details :", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const existingProduct = await Product.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updatedData = {
      product: req.body.productName || existingProduct.productName,
      price: req.body.price || existingProduct.price,
      category: req.body.category || existingProduct.category,
      stock: req.body.stock || existingProduct.stock,
      description: req.body.description || existingProduct.description,
      image: req.file?.path || existingProduct.image,
      imagePublicId: req.file?.filename || existingProduct.imagePublicId,
    };
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updatedData,
      { new: true }
    );

    res.status(200).json({
      message: "Product successfully updated",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error while updating product:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const setFavouriteProduct = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    let favProduct = await FavouriteProduct.findOne({ userId });

    if (favProduct) {
      if (favProduct.productId.includes(productId)) {
        return res
          .status(409)
          .json({ message: "Product already in favorites" });
      }

      favProduct.productId.push(productId);
      await favProduct.save();
    } else {
      favProduct = await FavouriteProduct.create({
        userId,
        productId: [productId],
      });
    }

    res.status(201).json({
      message: "Product added to favorites",
      favourites: favProduct,
    });
  } catch (error) {
    console.error("Error while adding product to favorites:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const removeFromFavouriteProduct = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const favProduct = await FavouriteProduct.findOne({ userId });

    if (!favProduct || !favProduct.productId.includes(productId)) {
      return res
        .status(404)
        .json({ message: "Product not found in favorites" });
    }

    favProduct.productId = favProduct.productId.filter(
      (id) => id.toString() !== productId
    );

    await favProduct.save();

    res.status(200).json({
      message: "Product removed from favorites",
      favourites: favProduct,
    });
  } catch (error) {
    console.error("Error while removing product from favorites:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getFavouriteProducts = async (req, res) => {
  try {
    const userId = req.user._id;

    const favProduct = await FavouriteProduct.findOne({ userId }).populate(
      "productId",
      "-stock"
    );

    if (!favProduct) {
      return res.status(404).json({ message: "No favorite products found" });
    }

    res.status(200).json({ favourites: favProduct.productId });
  } catch (error) {
    console.error("Error while fetching favorite products:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getCategories = async (req, res) => {
  try {
    const category = await Category.find();

    if (!category) {
      return res.status(404).json({ message: "Categories not found" });
    }

    return res.status(200).json({
      message: `categories of products fetched successfully`,
      data: category,
    });
  } catch (error) {
    console.error("Error while getting categories of products :", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
const getCategoryProducts = async (req, res) => {
  try {
    const { categoryId } = req.params;
    if (!categoryId) {
      return res.status(400).json({ message: "Category Id is required" });
    }

    const category = await Category.findById(categoryId).populate(
      "categoryProduct",
      "name image price description"
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (!category.categoryProduct || category.categoryProduct.length === 0) {
      return res.status(200).json({
        message: "No products in this category",
        products: [],
      });
    }

    return res.status(200).json({
      message: `In ${category.categoryName} category products fetched successfully`,
      products: category.categoryProduct,
    });
  } catch (error) {
    console.error("Error while getting category products :", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const searchProductsByName = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    const products = await Product.find({
      productName: { $regex: `^${q}`, $options: "i" },
    }).select("name image price description");

    if (products.length === 0) {
      return res.status(404).json({ message: "Match not found" });
    }
    res.status(200).json({
      message: "Products fetched successfully",
      products,
    });
  } catch (error) {
    console.error("Error while searching product :", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const addItemsToTheCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ userId: req.user._id });

    const product = await Product.findById(productId);

    if (!cart) {
      const newCart = await Cart.create({
        userId: req.user._id,
        cartItems: [
          {
            productId: product._id,
            quantity: 1,
            price: product.price,
            total: product.price * 1,
          },
        ],
        subTotal: product.price,
      });
      return res
        .status(201)
        .json({ message: "Item added successfully to the cart", newCart });
    }

    const existingItem = cart.cartItems.find(
      (item) => item.productId.toString() === productId
    );
    if (existingItem) {
      return res
        .status(409)
        .json({ message: "Product already exists in the cart" });
    }

    cart.cartItems.push({
      productId: product._id,
      quantity: 1,
      price: product.price,
      total: product.price * 1,
    });

    cart.subTotal = cart.cartItems.reduce((sum, item) => sum + item.total, 0);
    await cart.save();
    res
      .status(201)
      .json({ message: "Item added successfully to the cart", cart });
  } catch (error) {
    console.error("Error while adding item to the cart :", error);
  }
};

const removeItemFromCart = async (req, res) => {
  const { productId } = req.params;

  try {
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({ msg: "Cart not found" });
    }

    cart.cartItems.pull({ productId });
    cart.subTotal = cart.cartItems.reduce((sum, item) => sum + item.total, 0);
    await cart.save();

    res.json({ msg: "Product removed from cart" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

const updateItemInCart = async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({ msg: "Cart not found" });
    }

    const item = cart.cartItems.find(
      (item) => item.productId.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ msg: "Product not found in cart" });
    }

    item.quantity = quantity;

    item.total = item.quantity * item.price;

    cart.subTotal = cart.cartItems.reduce((sum, item) => sum + item.total, 0);
    await cart.save();

    res.json({ msg: "Product updated in cart", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

const addFavouritesToCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const favourites = await FavouriteProduct.findOne({ userId }).populate(
      "productId"
    );

    if (!favourites || favourites.productId.length === 0) {
      return res.status(404).json({ msg: "No favourite products found" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, cartItems: [] });
    }

    for (const product of favourites.productId) {
      const alreadyExists = cart.cartItems.some(
        (item) => item.productId.toString() === product._id.toString()
      );

      if (!alreadyExists) {
        cart.cartItems.push({
          productId: product._id,
          quantity: 1,
          price: product.price,
          total: product.price,
        });
      }
    }

    cart.subTotal = cart.cartItems.reduce((sum, item) => sum + item.total, 0);

    await cart.save();

    return res.status(200).json({
      msg: "All favourite products added to the cart successfully",
      cart,
    });
  } catch (err) {
    console.error("Error adding favourites to cart:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

const createOrder = async (req, res) => {
  const userId = req.user._id;
  const { Products, address, location } = req.body;

  try {
    const newOrder = new Order({
      userId,
      Products,
      address,
      location,
    });

    await newOrder.save();

    for (let orderedProduct of Products) {
      const product = await Product.findById(orderedProduct.ProductId);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${orderedProduct.ProductId}` });
      }

      if (product.stock < orderedProduct.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product: ${product.name}`,
        });
      }

      product.stock -= orderedProduct.quantity;
      await product.save();
    }
    res.status(201).json({
      message: "Order successfully created!",
      order: newOrder,
    });
  } catch (error) {
    console.error("Error While Ordering Product :", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: "order Id required" });
    }
    const data = await Order.findById({ _id: orderId }, "-location")
      .populate("userId", "fullName email")
      .lean();
    if (!data) {
      return res.status(404).json({ message: "No Order Found" });
    }

    res
      .status(200)
      .json({ message: "Order Details fetched sucessfully", data });
  } catch (error) {
    console.error("Error While getting order details :", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
const getOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({ message: "User Id required" });
    }
    const orders = await Order.find({ userId, status: "Pending" }, "-location")
      .populate("userId", "fullName email")
      .lean();
    if (orders.length === 0) {
      return res.status(404).json({ message: "No Orders Yet!" });
    }

    res.status(200).json({ message: "Orders found sucessfully", orders });
  } catch (error) {
    console.error("Error While getting orders of user :", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: "order id is required" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: "cancel" },
      { new: true }
    );
    res.json(order);
  } catch (error) {
    console.error("Error while canceling order", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const changeOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const order = await Order.findByIdAndUpdate(
      { _id: orderId },
      { status, note },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error while changing order status:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// const getAllCategory = async (req, res) => {
//   try {
//     const data = await Category.find({}, "category image categoryProduct");

//     if (data.length === 0) {
//       return res.status(404).json({ message: "Categories not found" });
//     }

//     res.status(200).json({
//       message: "Successfully fetched all the categorires",
//       data,
//     });
//   } catch (error) {
//     console.error("Error while getting all category", error);
//     res.status(500).json({success:false, message: "Internal Server Error" });
//   }
// };

// 5. Get multiple products by IDs (for bulk loading)
const bulkproducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: "Product IDs array is required",
      });
    }

    const products = await Product.find({
      _id: { $in: productIds },
    }).sort({ name: 1 });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

// 1. Get all categories
const getAllCategory = async (req, res) => {
  try {
    const categories = await Category.find({})
      .populate("categoryProduct", "name price image stock status")
      .sort({ category: 1 });

    res.json({
      success: true,
      data: categories,
      message: "Categories fetched successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

// 2. Get products by category ID
const getProductByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10, search = "" } = req.query;

    const category = await Category.findById(categoryId).populate({
      path: "categoryProduct",
      match: search ? { name: { $regex: search, $options: "i" } } : {},
      options: {
        skip: (page - 1) * limit,
        limit: parseInt(limit),
        sort: { name: 1 },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Get total count for pagination
    const totalProducts = await Product.countDocuments({
      _id: { $in: category.categoryProduct },
      ...(search && { name: { $regex: search, $options: "i" } }),
    });

    res.json({
      success: true,
      data: {
        category: category.category,
        products: category.categoryProduct,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalProducts / limit),
          totalProducts,
          limit: parseInt(limit),
        },
      },
      message: "Category products fetched successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching category products",
      error: error.message,
    });
  }
};

// 3. Get products by category name
const getProductByCategoryName = async (req, res) => {
  try {
    const { categoryName } = req.params;
    const { page = 1, limit = 10, search = "" } = req.query;

    const category = await Category.findOne({
      category: { $regex: new RegExp(categoryName, "i") },
    }).populate({
      path: "categoryProduct",
      match: search ? { name: { $regex: search, $options: "i" } } : {},
      options: {
        skip: (page - 1) * limit,
        limit: parseInt(limit),
        sort: { name: 1 },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const totalProducts = await Product.countDocuments({
      _id: { $in: category.categoryProduct },
      ...(search && { name: { $regex: search, $options: "i" } }),
    });

    res.json({
      success: true,
      data: {
        category: category.category,
        categoryId: category._id,
        products: category.categoryProduct,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalProducts / limit),
          totalProducts,
          limit: parseInt(limit),
        },
      },
      message: "Category products fetched successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching category products",
      error: error.message,
    });
  }
};

// 4. DataTable API endpoint (for server-side processing)
const datatabel = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { draw, start = 0, length = 10, search, order } = req.body;

    const searchValue = search?.value || "";
    const sortColumn = order?.[0]?.column || 0;
    const sortDirection = order?.[0]?.dir || "asc";

    // Define columns for sorting
    const columns = ["name", "price", "stock", "status", "createdAt"];
    const sortField = columns[sortColumn] || "name";
    const sortOrder = sortDirection === "desc" ? -1 : 1;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        draw: parseInt(draw),
        recordsTotal: 0,
        recordsFiltered: 0,
        data: [],
      });
    }

    // Build match query
    const matchQuery = {
      _id: { $in: category.categoryProduct },
    };

    if (searchValue) {
      matchQuery.name = { $regex: searchValue, $options: "i" };
    }

    // Get total records
    const totalRecords = category.categoryProduct.length;

    // Get filtered records count
    const filteredRecords = await Product.countDocuments(matchQuery);

    // Get paginated data
    const products = await Product.find(matchQuery)
      .sort({ [sortField]: sortOrder })
      .skip(parseInt(start))
      .limit(parseInt(length));

    // Format data for DataTable
    const formattedData = products.map((product) => [
      product.name,
      `$${product.price?.toFixed(2) || "0.00"}`,
      product.stock || 0,
      `<span class="badge badge-${
        product.status === "active" ? "success" : "danger"
      }">${product.status}</span>`,
      product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "",
      `<div class="btn-group">
        <button class="btn btn-sm btn-info" onclick="viewProduct('${product._id}')">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn btn-sm btn-warning" onclick="editProduct('${product._id}')">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product._id}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>`,
    ]);

    res.json({
      draw: parseInt(draw),
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      draw: parseInt(req.body.draw || 1),
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
      error: error.message,
    });
  }
};

module.exports = {
  setProduct,
  getProduct,
  deleteProduct,
  updateProduct,
  setFavouriteProduct,
  removeFromFavouriteProduct,
  getFavouriteProducts,
  getAllCategory,
  getCategoryProducts,
  searchProductsByName,
  addItemsToTheCart,
  removeItemFromCart,
  updateItemInCart,
  addFavouritesToCart,
  createOrder,
  getOrderDetails,
  getOrders,
  cancelOrder,
  changeOrderStatus,
  getProductByCategoryId,
  getProductByCategoryName,
  bulkproducts,
  datatabel,
};
