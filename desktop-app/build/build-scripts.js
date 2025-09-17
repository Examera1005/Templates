/**
 * Build Scripts for Electron App
 * Custom build hooks and utilities
 */

const fs = require('fs');
const path = require('path');

// Before build hook
const beforeBuild = async (context) => {
  console.log('Running before build hook...');
  
  try {
    // Ensure build directories exist
    const buildDir = path.join(context.appDir, 'build');
    const iconsDir = path.join(buildDir, 'icons');
    const resourcesDir = path.join(buildDir, 'resources');
    
    [buildDir, iconsDir, resourcesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    });
    
    // Generate version info
    const packageJson = JSON.parse(fs.readFileSync(path.join(context.appDir, 'package.json'), 'utf8'));
    const versionInfo = {
      version: packageJson.version,
      buildDate: new Date().toISOString(),
      buildNumber: process.env.BUILD_NUMBER || '1',
      commit: process.env.GIT_COMMIT || 'unknown'
    };
    
    fs.writeFileSync(
      path.join(resourcesDir, 'version.json'),
      JSON.stringify(versionInfo, null, 2)
    );
    
    console.log('Before build hook completed successfully');
  } catch (error) {
    console.error('Before build hook failed:', error);
    throw error;
  }
};

// After pack hook
const afterPack = async (context) => {
  console.log('Running after pack hook...');
  
  try {
    const { electronPlatformName, appOutDir } = context;
    
    // Platform-specific post-processing
    switch (electronPlatformName) {
      case 'win32':
        await processWindowsBuild(appOutDir);
        break;
      case 'darwin':
        await processMacBuild(appOutDir);
        break;
      case 'linux':
        await processLinuxBuild(appOutDir);
        break;
    }
    
    console.log('After pack hook completed successfully');
  } catch (error) {
    console.error('After pack hook failed:', error);
    throw error;
  }
};

// Windows-specific processing
const processWindowsBuild = async (appOutDir) => {
  console.log('Processing Windows build...');
  
  // Add Windows-specific files or configurations
  const windowsResourcesDir = path.join(appOutDir, 'resources');
  if (!fs.existsSync(windowsResourcesDir)) {
    fs.mkdirSync(windowsResourcesDir, { recursive: true });
  }
  
  // Create Windows-specific config
  const windowsConfig = {
    platform: 'windows',
    features: {
      autoUpdater: true,
      notifications: true,
      systemTray: true
    }
  };
  
  fs.writeFileSync(
    path.join(windowsResourcesDir, 'platform-config.json'),
    JSON.stringify(windowsConfig, null, 2)
  );
};

// macOS-specific processing
const processMacBuild = async (appOutDir) => {
  console.log('Processing macOS build...');
  
  // Add macOS-specific files or configurations
  const macResourcesDir = path.join(appOutDir, 'Contents', 'Resources');
  if (!fs.existsSync(macResourcesDir)) {
    fs.mkdirSync(macResourcesDir, { recursive: true });
  }
  
  // Create macOS-specific config
  const macConfig = {
    platform: 'darwin',
    features: {
      autoUpdater: true,
      notifications: true,
      touchBar: true,
      nativeMenus: true
    }
  };
  
  fs.writeFileSync(
    path.join(macResourcesDir, 'platform-config.json'),
    JSON.stringify(macConfig, null, 2)
  );
};

// Linux-specific processing
const processLinuxBuild = async (appOutDir) => {
  console.log('Processing Linux build...');
  
  // Add Linux-specific files or configurations
  const linuxResourcesDir = path.join(appOutDir, 'resources');
  if (!fs.existsSync(linuxResourcesDir)) {
    fs.mkdirSync(linuxResourcesDir, { recursive: true });
  }
  
  // Create Linux-specific config
  const linuxConfig = {
    platform: 'linux',
    features: {
      autoUpdater: true,
      notifications: true,
      systemTray: true
    }
  };
  
  fs.writeFileSync(
    path.join(linuxResourcesDir, 'platform-config.json'),
    JSON.stringify(linuxConfig, null, 2)
  );
};

module.exports = {
  beforeBuild,
  afterPack
};