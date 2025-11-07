/**
 * Installation manifest
 * Defines all components and their installation locations
 */

const paths = require('./paths');
const packageJson = require('../../package.json');

/**
 * Get installation manifest
 * @returns {object} Installation manifest
 */
function getManifest() {
  return {
    version: packageJson.version,
    installPath: paths.getInstallPath(),

    // Files to install
    components: {
      server: {
        name: 'server',
        type: 'required',
        source: 'server.ts',
        target: paths.getServerPath(),
        description: 'Main server implementation',
        preserveOnUpdate: false
      },
      voices: {
        name: 'voices',
        type: 'optional',
        source: 'voices.json',
        target: paths.getVoicesPath(),
        description: 'Voice configuration',
        preserveOnUpdate: true // Allow user customization
      }
    },

    // Service configuration
    service: {
      name: 'com.pai.voice-server',
      displayName: 'PAI Voice Server',
      plistPath: paths.getLaunchAgentPath(),
      logPath: paths.getLogPath(),
      port: 8888
    },

    // Environment requirements
    requirements: {
      platform: 'darwin', // macOS only
      minNodeVersion: '18.0.0',
      requiredCommands: ['bun', 'launchctl', 'curl'],
      optionalCommands: []
    }
  };
}

/**
 * Get list of required components
 * @returns {array} Array of required component objects
 */
function getRequiredComponents() {
  const manifest = getManifest();
  return Object.values(manifest.components).filter(c => c.type === 'required');
}

/**
 * Get list of optional components
 * @returns {array} Array of optional component objects
 */
function getOptionalComponents() {
  const manifest = getManifest();
  return Object.values(manifest.components).filter(c => c.type === 'optional');
}

/**
 * Get all components
 * @returns {array} Array of all component objects
 */
function getAllComponents() {
  const manifest = getManifest();
  return Object.values(manifest.components);
}

/**
 * Get component by name
 * @param {string} name - Component name
 * @returns {object|null} Component object or null if not found
 */
function getComponent(name) {
  const manifest = getManifest();
  return manifest.components[name] || null;
}

module.exports = {
  getManifest,
  getRequiredComponents,
  getOptionalComponents,
  getAllComponents,
  getComponent
};
