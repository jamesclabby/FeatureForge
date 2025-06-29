const Queue = require('bull');
const ResendProvider = require('../providers/ResendProvider');
const logger = require('../../../utils/logger');

class EmailQueue {
  constructor() {
    this.queue = null;
    this.provider = new ResendProvider();
    this.isInitialized = false;
  }

  /**
   * Initialize the email queue
   */
  async initialize() {
    try {
      // Use Redis URL if available, otherwise default to localhost
      const redisConfig = process.env.REDIS_URL 
        ? process.env.REDIS_URL 
        : { host: 'localhost', port: 6379 };

      this.queue = new Queue('email processing', redisConfig, {
        defaultJobOptions: {
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50,      // Keep last 50 failed jobs
          attempts: 3,           // Retry failed jobs 3 times
          backoff: {
            type: 'exponential',
            delay: 2000,         // Start with 2 second delay
          },
        },
      });

      // Set up job processing
      this.queue.process('invitation', this.processInvitationEmail.bind(this));
      this.queue.process('password-reset', this.processPasswordResetEmail.bind(this));
      this.queue.process('mention', this.processMentionEmail.bind(this));

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      logger.info('Email queue initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize email queue:', error);
      
      // If Redis is not available, fall back to direct processing
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        logger.warn('Redis not available, falling back to direct email processing');
        this.isInitialized = false;
      } else {
        throw error;
      }
    }
  }

  /**
   * Add email job to queue
   * @param {string} type - Email type
   * @param {Object} data - Email data
   */
  async add(type, data) {
    if (!this.isInitialized) {
      // Fallback to direct processing if queue is not available
      logger.info(`Queue not available, processing ${type} email directly`);
      return this.processEmailDirect(type, data);
    }

    try {
      const job = await this.queue.add(type, data, {
        priority: this.getJobPriority(type),
        delay: 0, // Send immediately
      });

      logger.info(`Email job added to queue: ${type}`, { jobId: job.id });
      return { jobId: job.id, queued: true };

    } catch (error) {
      logger.error(`Failed to add ${type} email to queue:`, error);
      
      // Fallback to direct processing
      logger.info(`Falling back to direct processing for ${type} email`);
      return this.processEmailDirect(type, data);
    }
  }

  /**
   * Process invitation email
   */
  async processInvitationEmail(job) {
    const { data } = job;
    logger.info('Processing invitation email', { jobId: job.id });

    try {
      const result = await this.provider.send({
        to: data.to,
        type: 'invitation',
        data: data.data
      });

      logger.info('Invitation email sent successfully', { 
        jobId: job.id, 
        messageId: result.messageId 
      });

      return result;

    } catch (error) {
      logger.error('Failed to send invitation email', { 
        jobId: job.id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Process password reset email
   */
  async processPasswordResetEmail(job) {
    const { data } = job;
    logger.info('Processing password reset email', { jobId: job.id });

    try {
      const result = await this.provider.send({
        to: data.to,
        type: 'password-reset',
        data: data.data
      });

      logger.info('Password reset email sent successfully', { 
        jobId: job.id, 
        messageId: result.messageId 
      });

      return result;

    } catch (error) {
      logger.error('Failed to send password reset email', { 
        jobId: job.id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Process mention notification email
   */
  async processMentionEmail(job) {
    const { data } = job;
    logger.info('Processing mention notification email', { jobId: job.id });

    try {
      const result = await this.provider.send({
        to: data.to,
        type: 'mention',
        data: data.data
      });

      logger.info('Mention notification email sent successfully', { 
        jobId: job.id, 
        messageId: result.messageId 
      });

      return result;

    } catch (error) {
      logger.error('Failed to send mention notification email', { 
        jobId: job.id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Process email directly without queue
   */
  async processEmailDirect(type, data) {
    try {
      const result = await this.provider.send({
        to: data.to,
        type: type,
        data: data.data
      });

      logger.info(`${type} email sent directly`, { messageId: result.messageId });
      return result;

    } catch (error) {
      logger.error(`Failed to send ${type} email directly:`, error);
      throw error;
    }
  }

  /**
   * Get job priority based on email type
   */
  getJobPriority(type) {
    const priorities = {
      'password-reset': 1,  // Highest priority
      'invitation': 2,      // Medium priority
      'mention': 3          // Lower priority
    };
    
    return priorities[type] || 5;
  }

  /**
   * Set up queue event listeners
   */
  setupEventListeners() {
    if (!this.queue) return;

    this.queue.on('completed', (job, result) => {
      logger.info('Email job completed', { 
        jobId: job.id, 
        type: job.name,
        messageId: result.messageId 
      });
    });

    this.queue.on('failed', (job, err) => {
      logger.error('Email job failed', { 
        jobId: job.id, 
        type: job.name,
        error: err.message,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts
      });
    });

    this.queue.on('stalled', (job) => {
      logger.warn('Email job stalled', { 
        jobId: job.id, 
        type: job.name 
      });
    });

    this.queue.on('error', (error) => {
      logger.error('Email queue error:', error);
    });
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    if (!this.isInitialized || !this.queue) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0
      };
    }

    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.queue.getWaiting(),
        this.queue.getActive(),
        this.queue.getCompleted(),
        this.queue.getFailed(),
        this.queue.getDelayed()
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length
      };

    } catch (error) {
      logger.error('Failed to get queue stats:', error);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        error: error.message
      };
    }
  }

  /**
   * Clean up old jobs
   */
  async cleanup() {
    if (!this.isInitialized || !this.queue) {
      return;
    }

    try {
      await this.queue.clean(24 * 60 * 60 * 1000, 'completed'); // Remove completed jobs older than 24 hours
      await this.queue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // Remove failed jobs older than 7 days
      logger.info('Email queue cleanup completed');
    } catch (error) {
      logger.error('Failed to cleanup email queue:', error);
    }
  }

  /**
   * Gracefully close the queue
   */
  async close() {
    if (this.queue) {
      await this.queue.close();
      logger.info('Email queue closed');
    }
  }
}

module.exports = EmailQueue; 