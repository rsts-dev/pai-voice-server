/**
 * Unit tests for logger utility
 */

const logger = require('../../lib/utils/logger');

describe('Logger Utility', () => {
  // Capture console output
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    logger.setVerbose(false);
    logger.setDryRun(false);
  });

  describe('setVerbose', () => {
    it('should enable verbose mode', () => {
      logger.setVerbose(true);
      logger.verbose('test message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should disable verbose mode by default', () => {
      logger.verbose('test message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('setDryRun', () => {
    it('should enable dry-run mode', () => {
      logger.setDryRun(true);
      logger.success('test');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DRY RUN]')
      );
    });

    it('should not show dry-run prefix when disabled', () => {
      logger.setDryRun(false);
      logger.success('test');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('[DRY RUN]')
      );
    });
  });

  describe('success', () => {
    it('should log success messages', () => {
      logger.success('Operation successful');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Operation successful')
      );
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      logger.error('Operation failed');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed')
      );
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Warning message');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning message')
      );
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Info message');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Info message')
      );
    });
  });

  describe('log', () => {
    it('should log plain messages', () => {
      logger.log('Plain message');
      expect(consoleLogSpy).toHaveBeenCalledWith('Plain message');
    });
  });

  describe('newline', () => {
    it('should log empty line', () => {
      logger.newline();
      expect(consoleLogSpy).toHaveBeenCalledWith('');
    });
  });
});
