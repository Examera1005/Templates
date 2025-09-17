/**
 * macOS Notarization Script
 * Handles code signing and notarization for macOS builds
 */

const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  // Only notarize macOS builds
  if (electronPlatformName !== 'darwin') {
    return;
  }
  
  // Check for required environment variables
  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_ID_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;
  
  if (!appleId || !appleIdPassword || !teamId) {
    console.warn('Skipping notarization: APPLE_ID, APPLE_ID_PASSWORD, or APPLE_TEAM_ID not set');
    return;
  }
  
  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;
  
  console.log(`Notarizing ${appPath}...`);
  
  try {
    await notarize({
      appBundleId: 'com.company.desktopapp',
      appPath: appPath,
      appleId: appleId,
      appleIdPassword: appleIdPassword,
      teamId: teamId,
      tool: 'notarytool'
    });
    
    console.log('Notarization completed successfully');
  } catch (error) {
    console.error('Notarization failed:', error);
    throw error;
  }
};