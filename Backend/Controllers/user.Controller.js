const Location = require("../Models/location.Model");

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

module.exports = {
  saveLocation,
};
