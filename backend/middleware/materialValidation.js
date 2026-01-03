/**
 * MATERIAL VALIDATION MIDDLEWARE
 * Validates materials against PowerGrid-approved list
 * 
 * WHY THIS IS IMPORTANT:
 * =====================
 * 1. PREVENTS COST OVERRUNS
 *    - Only approved materials have negotiated rates with vendors
 *    - Unapproved materials may have inflated prices
 *    - Example: "Wooden Plank" has no place in electrical infrastructure
 * 
 * 2. ENSURES QUALITY STANDARDS
 *    - All approved materials meet IS/IEC specifications
 *    - Tested and certified for PowerGrid projects
 *    - Prevents substandard material procurement
 * 
 * 3. STREAMLINES PROCUREMENT
 *    - Pre-negotiated vendor contracts for approved items
 *    - Faster approval process (no technical committee review needed)
 *    - Bulk purchasing advantages
 * 
 * 4. REGULATORY COMPLIANCE
 *    - Meets government and CEA (Central Electricity Authority) norms
 *    - Audit-friendly procurement records
 *    - Prevents fraudulent material entries
 * 
 * REAL-WORLD EXAMPLES:
 * ====================
 * ✅ APPROVED: "Tower Bolt M16" 
 *    - Standard hardware for transmission towers
 *    - IS 1367 certified
 *    - Pre-approved by technical committee
 * 
 * ❌ REJECTED: "Wooden Plank"
 *    - Not used in electrical infrastructure
 *    - No technical specifications
 *    - Could indicate data entry error or fraud attempt
 * 
 * ✅ APPROVED: "ACSR Conductor Moose"
 *    - Standard conductor type
 *    - IEC 61089 compliant
 *    - Regular procurement item
 * 
 * ❌ REJECTED: "Generic Copper Wire"
 *    - Too vague, no specifications
 *    - Multiple types exist with different ratings
 *    - Must specify exact conductor type (e.g., "ACSR Conductor Dog")
 */

const ApprovedMaterial = require('../models/ApprovedMaterial');

/**
 * Validate material before add/update
 */
const validateMaterial = async (req, res, next) => {
  try {
    const materialName = req.body.materialName || req.body.name;
    
    if (!materialName) {
      return res.status(400).json({
        success: false,
        status: 'VALIDATION_ERROR',
        message: 'Material name is required'
      });
    }

    // Check if material is approved
    const isApproved = await ApprovedMaterial.isApproved(materialName);
    
    if (!isApproved) {
      console.log(`\n❌ REJECTED: Invalid material "${materialName}"`);
      console.log('Reason: Not in PowerGrid approved materials list\n');
      
      return res.status(400).json({
        success: false,
        status: 'INVALID_MATERIAL',
        material: materialName,
        message: 'This material is not required for this project and cannot be added to inventory.',
        reason: 'Material not found in PowerGrid approved materials database',
        action: 'Please contact procurement department to add this material to approved list',
        helpText: 'Only IS/IEC certified materials approved by PowerGrid technical committee can be added to inventory'
      });
    }

    // Material is approved - get details and attach to request
    const approvedMaterial = await ApprovedMaterial.getApprovedMaterial(materialName);
    req.approvedMaterial = approvedMaterial;
    
    console.log(`✅ APPROVED: Material "${materialName}" validated successfully`);
    next();

  } catch (error) {
    console.error('Error in material validation:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating material',
      error: error.message
    });
  }
};

/**
 * Validate bulk materials (for CSV/Excel upload)
 */
const validateBulkMaterials = async (req, res, next) => {
  try {
    const materials = req.body.materials || [];
    
    if (!Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Materials array is required'
      });
    }

    const validationResults = {
      approved: [],
      rejected: [],
      total: materials.length
    };

    // Validate each material
    for (const material of materials) {
      const materialName = material.materialName || material.name;
      
      if (!materialName) {
        validationResults.rejected.push({
          material: material,
          reason: 'Material name is missing'
        });
        continue;
      }

      const isApproved = await ApprovedMaterial.isApproved(materialName);
      
      if (isApproved) {
        const approvedDetails = await ApprovedMaterial.getApprovedMaterial(materialName);
        validationResults.approved.push({
          ...material,
          approvedDetails: approvedDetails
        });
      } else {
        validationResults.rejected.push({
          material: materialName,
          data: material,
          reason: 'Not in PowerGrid approved materials list'
        });
      }
    }

    // Attach results to request
    req.validationResults = validationResults;
    
    console.log(`\n📊 Bulk Validation Results:`);
    console.log(`   Total: ${validationResults.total}`);
    console.log(`   ✅ Approved: ${validationResults.approved.length}`);
    console.log(`   ❌ Rejected: ${validationResults.rejected.length}\n`);
    
    next();

  } catch (error) {
    console.error('Error in bulk validation:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating bulk materials',
      error: error.message
    });
  }
};

module.exports = {
  validateMaterial,
  validateBulkMaterials
};
