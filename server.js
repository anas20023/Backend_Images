const express = require("express");
const cloudinary = require("cloudinary").v2;
const app = express();
const port = process.env.PORT || 5000;

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: "dv7sp7pxk",
  api_key: "267412423169762",
  api_secret: "MhpbKaw8g0otKKehIlWsebgnwDI",
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
