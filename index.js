import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import { DatabaseConnect } from './db/Database.js';
import seedProducts from './routes/productRoutes.js'
import getTransaction from './routes/productRoutes.js'
import getProductsDetails from './routes/productRoutes.js'
const app = express();

config();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors())
app.use('/api',seedProducts)
app.use('/api',getTransaction)
app.use('/api',getProductsDetails)
DatabaseConnect();
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
