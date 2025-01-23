import { catagoriesOfItems, monthlyTransaction, priceRangeOfItems } from '../Controller/TransactionController.js'

export const CombineHandler = async (req,res)=>{
  try {
    const [monthlyOfTransaction,priceRangeItmes,catagoriesItems] = await Promise.all([
        monthlyTransaction(req),
        priceRangeOfItems(req),
        catagoriesOfItems(req),
      
    ])
    const combineResult = {
        monthlyTransaction: monthlyOfTransaction,
        priceRangeOfItems: priceRangeItmes,
        categoriesOfItems: catagoriesItems,
      
    }
    return res.status(200).json({
        success:true,
        data:combineResult
    })
  } catch (error) {
    console.log(error)
  }

}