import express , {Router}  from "express"
import { createCountry, getCountries, getCountryByCode } from "../controllers/country.controller.ts"


const router = express.Router()

 router.post("/create" , createCountry);
 router.get("/" , getCountries);
 router.get("/:code" , getCountryByCode);

 export default router;