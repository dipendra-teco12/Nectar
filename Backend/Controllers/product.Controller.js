// product.Controller.js
const Category = require("../Models/category.Model");
const FavouriteProduct = require("../Models/fevouriteProducts.Model");
const Product = require("../Models/product.Model");
const Cart = require("../Models/cart.Model");
const setProduct = async (req, res) => {
  try {
    const { productName, price, category, stock, description } = req.body;

    // Validate required fields
    if (!productName || !price || !category || !description || !stock) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Handle image upload
    const imageUrl = req.file?.path || null;
    const imagePublicId = req.file?.filename || null;

    // Create the product
    const product = await Product.create({
      productName,
      price,
      stock,
      description,
      image: imageUrl,
      imagePublicId,
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
    res.status(500).json({ message: "Internal server error" });
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
      name: product.name,
      image: product.image,
      description: product.description,
      price: product.price,
      category: product.category,
    };
    res.status(200).json({ message: "Product Successfully Fetched", data });
  } catch (error) {
    console.error("Error While Getting Product Details :", error);
    res.status(500).json({ message: "Internal Server Error" });
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
    const data = {
      name: product.name,
      image: product.image,
      description: product.description,
      price: product.price,
      category: product.category,
    };
    res.status(200).json({ message: "Product Successfully Deleted", data });
  } catch (error) {
    console.error("Error While Deleting Product Details :", error);
    res.status(500).json({ message: "Internal Server Error" });
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
      name: req.body.name || existingProduct.name,
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
    res.status(500).json({ message: "Internal server error" });
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
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const removeFromFavouriteProduct = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    console.log(productId);
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
    res.status(500).json({ message: "Internal Server Error" });
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
    res.status(500).json({ message: "Internal Server Error" });
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
    return res.status(500).json({ message: "Internal Server Error" });
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
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const searchProductsByName = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    const products = await Product.find({
      name: { $regex: `^${q}`, $options: "i" },
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
    res.status(500).json({ message: "Internal Server Error" });
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

const Order = require("../Models/order.Model");

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
    res.status(500).json({ message: "Internal Server Error" });
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
    res.status(500).json({ message: "Internal Server Error" });
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
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllCategory = async (req, res) => {
  try {
    const data = await Category.find({}, "category image categoryProduct");

    if (data.length === 0) {
      return res.status(404).json({ message: "Categories not found" });
    }

    res.status(200).json({
      message: "Successfully fetched all the categorires",
      data,
    });
  } catch (error) {
    console.error("Error while getting all category", error);
    res.status(500).json({ message: "Internal Server Error" });
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
  getOrders,
  cancelOrder,
};
