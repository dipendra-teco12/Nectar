const Location = require("../Models/location.Model");
const User = require("../Models/user.Model");

const saveLocation = async (req, res) => {
  try {
    const { name, longitude, latitude } = req.body;
    const loc = new Location({
      name,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
    });
    await loc.save();
    res.status(201).json({ message: "location Seved Successfully", loc });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

const getUser = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    let user;
    if (email.includes("@")) {
      user = await User.findOne({ email: decodeURIComponent(email) });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const data = {
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.isDeleted ? "Inactive" : "Active", // Convert boolean to string
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin || null,
      loginCount: user.loginCount || 0,
      phone: user.phone || null,
      address: user.address || null,
      profile: user.profile || null,
    };

    res.status(200).json({
      success: true,
      message: "User found successfully",
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const getUserList = async (req, res) => {
  try {
    // Parse DataTables parameters correctly
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get search value - DataTables sends it as search[value]
    const searchValue = req.query["search[value]"] || "";

    // Get sorting parameters - DataTables sends as order[0][column] and order[0][dir]
    const sortColumnIndex = parseInt(req.query["order[0][column]"]) || 0;
    const sortDirection = req.query["order[0][dir]"] || "asc";

    const columnMap = {
      0: "fullName",
      1: "email",
      2: "role",
      3: "isDeleted",
      4: null,
    };

    const sortField = columnMap[sortColumnIndex] || "fullName";
    const sortOrder = sortDirection === "desc" ? -1 : 1;



    // Build search query
    let searchQuery = {};
    if (searchValue.trim()) {
      searchQuery = {
        $or: [
          { fullName: { $regex: searchValue, $options: "i" } },
          { email: { $regex: searchValue, $options: "i" } },
          { role: { $regex: searchValue, $options: "i" } },
        ],
      };
    }


    // Get counts
    const totalUsers = await User.countDocuments({});
    const filteredUsers = await User.countDocuments(searchQuery);

    // Build sort object
    let sortObj = {};
    if (sortField && sortField !== null) {
      sortObj[sortField] = sortOrder;
    } else {
      sortObj = { createdAt: -1 };
    }



    // Get users
    const userData = await User.find(
      searchQuery,
      "fullName email role isDeleted createdAt updatedAt"
    )
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

 

 

    // Format data - ensure all fields are strings/defined
    const formattedData = userData.map((user) => {
      const formatted = {
        id: user._id.toString(),
        fullName: user.fullName || "",
        email: user.email || "",
        role: user.role || "user",
        isActive: user.isDeleted ? "Inactive" : "Active",
        status: user.isDeleted
          ? '<span class="badge badge-danger">Inactive</span>'
          : '<span class="badge badge-success">Active</span>',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return formatted;
    });

  

    // DataTables expects specific structure
    const response = {
      draw: parseInt(req.query.draw) || 1,
      recordsTotal: totalUsers,
      recordsFiltered: filteredUsers,
      data: formattedData,
    };

 

    res.json(response);
  } catch (error) {
    console.error("Error in getUserList:", error);
    res.status(500).json({
      draw: parseInt(req.query.draw) || 1,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
      error: error.message,
    });
  }
};
const changeAccountStatus = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    //
    const user = await User.findOne({ email: decodeURIComponent(email) });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isDeleted = !user.isDeleted;
    await user.save();

    const statusText = user.isDeleted ? "deactivated" : "activated";

    res.status(200).json({
      success: true,
      message: `User account ${statusText} successfully`,
      newStatus: user.isDeleted ? "Inactive" : "Active",
    });
  } catch (error) {
    console.log("Error while changing account status:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOneAndUpdate(
      { email: decodeURIComponent(email) },
      { isDeleted: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log("Error while deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
module.exports = {
  getUser,
  getUserList,
  saveLocation,
  changeAccountStatus,
  deleteUser,
};
