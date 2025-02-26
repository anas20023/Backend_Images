const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Configure CORS options
const allowedOrigins = [
  "http://localhost:5173",
  "https://www.videoarchive.studio",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg =
        "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Enable preflight for all routes

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

const port = process.env.PORT || 5000;

// File upload route
app.post("/api/upload", upload.single("file"), async (req, res) => {
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
        res.json({
          public_id: result.public_id,
          url: result.secure_url,
          created_at: result.created_at,
        }); // Return the public ID, URL, and creation date
      }
    );

    stream.pipe(uploadStream);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// Fetch all videos
app.get("/api/videos", async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: "upload",
      resource_type: "video",
      max_results: 500, // Adjust based on your needs
    });

    const videoData = result.resources.map((video) => ({
      url: video.secure_url,
      title: video.public_id,
      created_at: video.created_at, // Include the creation date
    }));

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
