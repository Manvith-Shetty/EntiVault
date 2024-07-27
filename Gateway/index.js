import express from "express";
import cors from "cors";
import proxy from "express-http-proxy"; //used to redirect the request to correspoding service

const app = express();

app.use(cors());
app.use(express.json());

app.use("/user", proxy("http://localhost:8002"));
app.use("/list", proxy("http://localhost:8003"));
app.use("/", proxy("http://localhost:8001"));

app.listen(8000, () => {
  console.log("Gateway is Listening to Port 8000");
});
