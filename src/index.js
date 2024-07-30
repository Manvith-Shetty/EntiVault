import express from "express";
import cors from "cors";
import proxy from "express-http-proxy"; // used to redirect requests to corresponding services

const app = express();

app.use(cors());
app.use(express.json());

// Routes for Authentication service
app.use(
  "/auth",
  proxy("http://localhost:8002", {
    proxyReqPathResolver: (req) => {
      const path = `/auth${req.url}`;
      console.log(`Redirecting request to Authentication service: ${path}`);
      return path;
    },
  })
);

// Routes for List service
app.use(
  "/list",
  proxy("http://localhost:8003", {
    proxyReqPathResolver: (req) => {
      const path = `/list${req.url}`;
      console.log(`Redirecting request to List service: ${path}`);
      return path;
    },
  })
);

// Routes for AniData service
app.use(
  "/anidata",
  proxy("http://localhost:8001", {
    proxyReqPathResolver: (req) => {
      const path = `/anidata${req.url}`;
      console.log(`Redirecting request to AniData service: ${path}`);
      return path;
    },
  })
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error encountered:", err);
  res.status(500).send("Something went wrong!");
});

app.listen(8000, () => {
  console.log("Gateway is listening on port 8000");
});
