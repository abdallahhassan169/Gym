import {} from "dotenv/config";
import express from "express";
import cors from "cors";
import process from "process";

import multer from "multer";
import { sports, types } from "./src/lookups/lookups.js";
import { qrs, user_image } from "./src/images_src/images.js";
import {
  add_user,
  registration,
  user_by_id,
  user_scan,
  users,
  users_logs,
} from "./src/users/user.js";
import {
  add_product,
  add_product_transaction,
  add_shipment,
  product_profit,
  product_reports,
  products,
  products_shipments,
} from "./src/products/products.js";
import {
  add_cost,
  bills,
  cost_data,
  reports,
  subs_costs,
} from "./src/finance/finance.js";

// Create a function to scan the QR code from an image file

const app = express();
app.use(express.json());
app.use(cors());
const cost_upload = multer({ dest: process.cwd() + "/cost_images/" });
const user_upload = multer({ dest: process.cwd() + "/users/" });
app.get("/types", types);

app.get("/sports", sports);

app.get("/img", qrs);

app.get("/user_img", user_image);

app.get("/user_by_id", user_by_id);
app.post("/scan", user_scan);

app.get("/users", users);
app.get("/users_log", users_logs);

app.get("/product_prices", products_shipments);

app.get("/products", products);

app.get("/subs_costs", subs_costs);

app.get("/reports", reports);

app.get("/product_reports", product_reports);

app.get("/product_transactions", product_profit);

app.post("/add_user", user_upload.single("image"), add_user);

app.post("/add_product", add_product);

app.post("/add_product_transaction", add_product_transaction);

app.post("/add_shipment", add_shipment);

app.post("/add_reg", registration);

app.post("/add_cost", cost_upload.single("image"), add_cost);

app.get("/bills", bills);

app.get("/cost_data", cost_data);
app.listen(3013, () => {
  console.log(`server is up on port ${3012}`);
});
