import express from "express";
const router = express.Router();

import Company from "../models/Company.js";

// CREATE COMPANY
router.post("/", async (req, res) => {
    try {
        const company = await Company.create(req.body);

        res.status(201).json({
            success: true,
            company,
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map(
                (err) => err.message
            );

            return res.status(400).json({
                success: false,
                errors,
            });
        }

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// GET ALL COMPANIES
router.get("/", async (req, res) => {
    try {
        const companies = await Company.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: companies.length,
            companies,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// GET SINGLE COMPANY
router.get("/:id", async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        res.status(200).json({
            success: true,
            company,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// UPDATE COMPANY
router.put("/:id", async (req, res) => {
    try {
        const company = await Company.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        res.status(200).json({
            success: true,
            company,
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map(
                (err) => err.message
            );

            return res.status(400).json({
                success: false,
                errors,
            });
        }

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// DELETE COMPANY
router.delete("/:id", async (req, res) => {
    try {
        const company = await Company.findByIdAndDelete(req.params.id);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Company deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

export default router;