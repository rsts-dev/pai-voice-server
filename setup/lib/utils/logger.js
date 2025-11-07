/**
 * Logger utility for user-friendly colored output
 * Provides consistent formatting across all commands
 */

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Logger state
let verboseMode = false;
let dryRunMode = false;

/**
 * Set verbose mode
 */
function setVerbose(enabled) {
  verboseMode = enabled;
}

/**
 * Set dry-run mode
 */
function setDryRun(enabled) {
  dryRunMode = enabled;
}

/**
 * Get dry-run prefix
 */
function getDryRunPrefix() {
  return dryRunMode ? `${colors.yellow}[DRY RUN]${colors.reset} ` : '';
}

/**
 * Success message (green checkmark)
 */
function success(message) {
  console.log(`${getDryRunPrefix()}${colors.green}✓${colors.reset} ${message}`);
}

/**
 * Error message (red X)
 */
function error(message) {
  console.error(`${colors.red}✗${colors.reset} ${message}`);
}

/**
 * Warning message (yellow warning)
 */
function warn(message) {
  console.log(`${getDryRunPrefix()}${colors.yellow}⚠${colors.reset} ${message}`);
}

/**
 * Info message (blue arrow)
 */
function info(message) {
  console.log(`${getDryRunPrefix()}${colors.blue}▶${colors.reset} ${message}`);
}

/**
 * Verbose message (only shown in verbose mode)
 */
function verbose(message) {
  if (verboseMode) {
    console.log(`${colors.dim}  ${message}${colors.reset}`);
  }
}

/**
 * Plain message
 */
function log(message) {
  console.log(message);
}

/**
 * Empty line
 */
function newline() {
  console.log('');
}

/**
 * Box header
 */
function boxHeader(title) {
  const line = '━'.repeat(60);
  console.log(`${colors.blue}${line}${colors.reset}`);
  console.log(`${colors.blue}     ${title}${colors.reset}`);
  console.log(`${colors.blue}${line}${colors.reset}`);
}

/**
 * Success box
 */
function successBox(title) {
  const line = '━'.repeat(60);
  console.log('');
  console.log(`${colors.green}${line}${colors.reset}`);
  console.log(`${colors.green}     ✓ ${title}${colors.reset}`);
  console.log(`${colors.green}${line}${colors.reset}`);
}

/**
 * Error box
 */
function errorBox(title) {
  const line = '━'.repeat(60);
  console.log('');
  console.log(`${colors.red}${line}${colors.reset}`);
  console.log(`${colors.red}     ✗ ${title}${colors.reset}`);
  console.log(`${colors.red}${line}${colors.reset}`);
}

/**
 * Dry-run notice
 */
function dryRunNotice() {
  if (dryRunMode) {
    console.log('');
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.yellow}     DRY RUN MODE - No changes will be made${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log('');
  }
}

/**
 * Section header
 */
function section(title) {
  console.log('');
  console.log(`${colors.bright}${title}${colors.reset}`);
}

/**
 * Key-value pair
 */
function keyValue(key, value) {
  console.log(`  • ${key}: ${value}`);
}

module.exports = {
  setVerbose,
  setDryRun,
  success,
  error,
  warn,
  info,
  verbose,
  log,
  newline,
  boxHeader,
  successBox,
  errorBox,
  dryRunNotice,
  section,
  keyValue,
  colors
};
