const express = require("express");
const cloudinary = require("cloudinary").v2;
const app = express();
require("dotenv").config();
const cors = require('cors');
app.use(cors());

const port = process.env.PORT || 5000;

// Configure Cloudinary with your credentials
app.use(express.json());
const name = process.env.CLD_NAME;
const api_key = process.env.CLD_API_KEY;
const api_secret = process.env.CLD_API_SECRET;
cloudinary.config({
  cloud_name: name,
  api_key: api_key,
  api_secret: api_secret,
  secure: true,
});
// Route to fetch all videos from Cloudinary
app.get("/api/videos", async (req, res) => {
  try {
    // Fetch all videos
    const result = await cloudinary.api.resources({
      type: "upload",
      resource_type: "video",
      max_results: 500, // Adjust based on your needs
    });

    // Map the result to the required format
    const videoData = result.resources.map((video) => ({
      url: video.secure_url,
      title: video.public_id,
    }));

    res.json(videoData);
  } catch (error) {
    console.error("Error fetching videos from Cloudinary", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});
app.get("/", (req, res) => {
  res.send({ msg: "Server  Working well" });
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
