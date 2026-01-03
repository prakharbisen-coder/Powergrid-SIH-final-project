const express = require('express');
const router = express.Router();
const {
  getScenarios,
  getScenario,
  createScenario,
  updateScenario,
  deleteScenario
} = require('../controllers/scenarioController');
const { protect } = require('../middleware/auth');

router.use(protect); // All routes require authentication

router
  .route('/')
  .get(getScenarios)
  .post(createScenario);

router
  .route('/:id')
  .get(getScenario)
  .put(updateScenario)
  .delete(deleteScenario);

module.exports = router;
