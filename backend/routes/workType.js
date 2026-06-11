import express from 'express';
import WorkType from '../models/WorkType.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const workTypes = await WorkType.find({});
    res.json(workTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const workType = new WorkType(req.body);
    await workType.save();
    res.status(201).json(workType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const workType = await WorkType.findByIdAndDelete(req.params.id);
    if (!workType) {
      return res.status(404).json({ message: 'Work type not found' });
    }
    res.json(workType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const workType = await WorkType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!workType) {
      return res.status(404).json({ message: 'Work type not found' });
    }
    res.json(workType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;