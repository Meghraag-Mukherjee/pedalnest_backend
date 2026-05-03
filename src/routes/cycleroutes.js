import { Router } from "express";
import { authRequired, roleRequired } from "../middleware/auth.js";
import { Cycle } from "../models/cyclemodel.js";

const router = Router();

// Public: Get all available cycles
router.get("/", async (req, res) => {
  const cycles = await Cycle.findAll({ where: { status: 'AVAILABLE' } });
  res.json(cycles);
});

// Admin Only: Add a new cycle
router.post("/add", authRequired, roleRequired(["ADMIN"]), async (req, res) => {
  try {
    const cycle = await Cycle.create(req.body);
    res.status(201).json(cycle);
  } catch (err) {
    res.status(500).json({ message: "Error adding cycle" });
  }
});
// Example: backend/routes/cycleRoutes.js

// UPDATE CYCLE
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { model_name, category, hourly_rate, image_url } = req.body;
    
    const cycle = await Cycle.findByPk(id);
    if (!cycle) return res.status(404).json({ message: "Cycle not found" });

    await cycle.update({ model_name, category, hourly_rate, image_url });
    res.json({ message: "Updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error during update" });
  }
});

// DELETE CYCLE
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const cycle = await Cycle.findByPk(id);
    if (!cycle) return res.status(404).json({ message: "Cycle not found" });

    await cycle.destroy();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error during deletion" });
  }
});

export default router;