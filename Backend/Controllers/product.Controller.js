// product.Controller.js
const Category = require("../Models/category.Model");
const FavouriteProduct = require("../Models/fevouriteProducts.Model");
const Product = require("../Models/product.Model");

const setProduct = async (req, res) => {
  try {
    const { name, price, categoryName, stock, description } = req.body;

    // Validate required fields
    if (!name || !price || !categoryName || !description || !stock) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Handle image upload
    const imageUrl = req.file?.path || null;
    const imagePublicId = req.file?.filename || null;

    // Create the product
    const product = await Product.create({
      name,
      price,
      stock,
      description,
      image: imageUrl,
      imagePublicId,
    });

    let category = await Category.findOne({ categoryName });
    if (!category) {
      category = await Category.create({ categoryName });
    }
    category.categoryProduct.push(product._id);
    await category.save();

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
      return res.status(400).json({ message: " Product id is Required" });
    }
    if (!userId) {
      return res.status(400).json({ message: " user id is Required" });
    }
    const Product = await FavouriteProduct.create({
      userId,
      productId,
    });

    res
      .status(201)
      .json({ message: "Product Added in Favourite List", Product });
  } catch (error) {
    console.error("Error While Adding Product in Favourite List :", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const removeFromFavouriteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "id is Required" });
    }
    const product = await FavouriteProduct.findByIdAndDelete({
      _id: id,
    });

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found or already deleted" });
    }

    res.status(201).json({
      message: "Product Remove from Favourite List",
      product,
    });
  } catch (error) {
    console.error("Error While Removing Product From Favourite List :", error);
    res.status(500).json({ message: "Internal Server Error" });
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

module.exports = {
  setProduct,
  getProduct,
  deleteProduct,
  updateProduct,
  setFavouriteProduct,
  removeFromFavouriteProduct,
  getCategoryProducts,
  searchProductsByName,
};
