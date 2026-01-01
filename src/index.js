import express from "express";
import dotenv from "dotenv";
import cors from "cors"
import bodyParser from "body-parser";
import { sequelize } from "./models/index.js"
import routes from "./routes/ApiRoutes.js"
import { fileURLToPath } from "url";


dotenv.config()
const app = express()
app.use(bodyParser.json())

//sync DB
sequelize.sync()

//Routes
app.use('/', routes)

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});


app.get('/', (req, res) => {
  res.send(' API is running...');
});
const PORT = process.env.PORT || 8000

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app