import { Country } from "../models/country.model.ts";
import type { Request, Response } from "express";
export const createCountry = async (req: Request, res: Response) => {
    try {


        const country = await Country.create(req.body);

        res.status(201).json(country);

    } catch (error) {
        res.status(500).json({ message: "Error Creating Country", error });
        console.log(error)
    }
};

export const getCountries = async (req: Request, res: Response) => {
    try {
        const countries = await Country.find();
        
        if(!countries) return res.status(404).json({
            message : "Cannot find Countries"
        });

        res.status(200).json(countries);
    } catch (error) {
        res.status(500).json({ message: "Error Finding Countries", error });
        console.log(error)
    }
};

export const getCountryByCode = async (req : Request , res : Response) => {
    try{
        const {code} = req.params;

        const country = await Country.findOne({
            code : code 
        }).lean() ;

        if (!country) return res.status(404).json({
            message : "Country not found"
        });

        res.status(200).json(country);            
        
    }catch (error) {
        res.status(500).json({ message: "Error Finding Country", error });
        console.log(error)
    }
}