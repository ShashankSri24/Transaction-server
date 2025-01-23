import express from 'express'
import {  getTransaction, seedDatabase} from '../Controller/TransactionController.js'
import { CombineHandler } from '../Controller/CombineHandler.js';

const router = express.Router()

router.post('/seed', seedDatabase);
router.get('/get-transaction',getTransaction)
router.get('/get-product-details',CombineHandler)
export default router