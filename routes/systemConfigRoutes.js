import express from 'express';
import SystemConfig from '../models/SystemConfig.js';

const router = express.Router();

// Initialize or update system configuration
router.post('/init-config', async (req, res) => {
  try {
    const configData = {
      config_id: 'system_config_v1',
      backend_ip: '10.26.83.239',
      frontend_ip: '10.26.83.239',
      database_ip: '10.26.83.239',
      port: 5001,
      mongodb_uri: 'mongodb://localhost:27017/smartAgri'
    };

    // Check if config already exists
    let config = await SystemConfig.findOne({ config_id: 'system_config_v1' });

    if (config) {
      // Update existing config
      config = await SystemConfig.findOneAndUpdate(
        { config_id: 'system_config_v1' },
        configData,
        { new: true, runValidators: true }
      );
      return res.json({
        success: true,
        message: 'System configuration updated successfully',
        data: config
      });
    } else {
      // Create new config
      config = new SystemConfig(configData);
      await config.save();
      return res.status(201).json({
        success: true,
        message: 'System configuration created successfully',
        data: config
      });
    }
  } catch (error) {
    console.error('Error initializing system config:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing system configuration',
      error: error.message
    });
  }
});

// Get current system configuration
router.get('/config', async (req, res) => {
  try {
    const config = await SystemConfig.findOne({ config_id: 'system_config_v1' });
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'System configuration not found. Please initialize it first.'
      });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching system config:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system configuration',
      error: error.message
    });
  }
});

// Update system configuration
router.put('/update-config', async (req, res) => {
  try {
    const { backend_ip, frontend_ip, database_ip, port, mongodb_uri } = req.body;

    const config = await SystemConfig.findOneAndUpdate(
      { config_id: 'system_config_v1' },
      {
        backend_ip,
        frontend_ip,
        database_ip,
        port,
        mongodb_uri
      },
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'System configuration not found'
      });
    }

    res.json({
      success: true,
      message: 'System configuration updated successfully',
      data: config
    });
  } catch (error) {
    console.error('Error updating system config:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating system configuration',
      error: error.message
    });
  }
});

export default router;
