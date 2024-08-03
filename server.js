const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");
const util = require("util");
const cors = require("cors");
const app = express();
require("dotenv").config();

// Configure CORS options
app.use(
  cors({
    origin: "https://videoarchive.vercel.app", // Your frontend origin
  })
);

// Multer setup
const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({ storage: storage });

// Convert buffer to stream
const bufferToStream = (buffer) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};
const port = process.env.PORT || 5000;

// File upload route
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { public_id } = req.body; // Extract public ID from request body
    const stream = bufferToStream(req.file.buffer);
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        public_id: public_id, // Use the public ID provided by the user
      },
      (error, result) => {
        if (error) {
          return res.status(500).json({ error: "Upload failed" });
        }
        res.json({ public_id: result.public_id }); // Return the public ID
      }
    );

    stream.pipe(uploadStream);
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

// Configure Cloudinary with your credentials
const name = process.env.CLD_NAME;
const api_key = process.env.CLD_API_KEY;
const api_secret = process.env.CLD_API_SECRET;
cloudinary.config({
  cloud_name: name,
  api_key: api_key,
  api_secret: api_secret,
  secure: true,
});

app.get("/api/videos", async (req, res) => {
  try {
    // Fetch all videos
    const result = await cloudinary.api.resources({
      type: "upload",
      resource_type: "video",
      max_results: 500, // Adjust based on your needs
    });

    // Map the result to include the upload date and sort by it
    const videoData = result.resources
      .map((video) => ({
        url: video.secure_url,
        title: video.public_id,
        created_at: video.created_at, // Include the creation date
      }))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // Sort by creation date

    res.json(videoData);
  } catch (error) {
    console.error("Error fetching videos from Cloudinary", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

app.get("/", (req, res) => {
  res.send({ msg: "Server working well" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
