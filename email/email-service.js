/**
 * Email Service Manager
 * Comprehensive email handling with SMTP integration and template rendering
 * Supports multiple providers and queue management
 */

class EmailService {
    constructor(config = {}) {
        this.config = {
            provider: 'smtp',
            smtp: {
                host: 'localhost',
                port: 587,
                secure: false,
                auth: {
                    user: '',
                    pass: ''
                }
            },
            from: {
                name: 'App Name',
                email: 'noreply@example.com'
            },
            templates: {
                directory: './email/templates',
                cache: true
            },
            queue: {
                enabled: false,
                redis: {
                    host: 'localhost',
                    port: 6379
                }
            },
            retry: {
                attempts: 3,
                delay: 1000
            },
            ...config
        };
        
        this.transporter = null;
        this.templateCache = new Map();
        this.queue = [];
        this.isConnected = false;
    }
    
    async connect() {
        try {
            switch (this.config.provider) {
                case 'smtp':
                    await this.connectSMTP();
                    break;
                case 'sendgrid':
                    await this.connectSendGrid();
                    break;
                case 'mailgun':
                    await this.connectMailgun();
                    break;
                case 'ses':
                    await this.connectSES();
                    break;
                default:
                    throw new Error(`Unsupported email provider: ${this.config.provider}`);
            }
            
            this.isConnected = true;
            console.log(`Email service connected: ${this.config.provider}`);
            
        } catch (error) {
            console.error('Email service connection failed:', error);
            throw error;
        }
    }
    
    async connectSMTP() {
        // Simulate SMTP connection
        this.transporter = new SMTPTransporter(this.config.smtp);
        await this.transporter.connect();
    }
    
    async connectSendGrid() {
        this.transporter = new SendGridTransporter(this.config.sendgrid);
    }
    
    async connectMailgun() {
        this.transporter = new MailgunTransporter(this.config.mailgun);
    }
    
    async connectSES() {
        this.transporter = new SESTransporter(this.config.ses);
    }
    
    async sendEmail(options) {
        if (!this.isConnected) {
            await this.connect();
        }
        
        const emailData = await this.prepareEmail(options);
        
        try {
            if (this.config.queue.enabled) {
                return await this.queueEmail(emailData);
            } else {
                return await this.sendDirectly(emailData);
            }
        } catch (error) {
            console.error('Email send failed:', error);
            throw error;
        }
    }
    
    async prepareEmail(options) {
        const emailData = {
            to: options.to,
            cc: options.cc,
            bcc: options.bcc,
            subject: options.subject,
            from: options.from || this.formatFromAddress(),
            replyTo: options.replyTo,
            html: options.html,
            text: options.text,
            attachments: options.attachments || [],
            headers: options.headers || {},
            priority: options.priority || 'normal',
            timestamp: Date.now()
        };
        
        // Render template if specified
        if (options.template) {
            const rendered = await this.renderTemplate(
                options.template,
                options.data || {}
            );
            emailData.html = rendered.html;
            emailData.text = rendered.text;
            emailData.subject = rendered.subject || emailData.subject;
        }
        
        // Validate email data
        this.validateEmail(emailData);
        
        return emailData;
    }
    
    async renderTemplate(templateName, data = {}) {
        let template = this.templateCache.get(templateName);
        
        if (!template || !this.config.templates.cache) {
            template = await this.loadTemplate(templateName);
            if (this.config.templates.cache) {
                this.templateCache.set(templateName, template);
            }
        }
        
        const renderer = new TemplateRenderer(template, data);
        return await renderer.render();
    }
    
    async loadTemplate(templateName) {
        // In a real implementation, this would load from filesystem
        return this.getBuiltInTemplate(templateName);
    }
    
    getBuiltInTemplate(templateName) {
        const templates = {
            welcome: {
                subject: 'Welcome to {{appName}}!',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Welcome</title>
                        <style>
                            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
                            .content { padding: 20px; }
                            .button { background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Welcome to {{appName}}</h1>
                            </div>
                            <div class="content">
                                <h2>Hello {{name}}!</h2>
                                <p>Thank you for joining {{appName}}. We're excited to have you on board!</p>
                                <p>To get started, please verify your email address by clicking the button below:</p>
                                <p style="text-align: center;">
                                    <a href="{{verificationUrl}}" class="button">Verify Email</a>
                                </p>
                                <p>If you didn't create this account, please ignore this email.</p>
                                <p>Best regards,<br>The {{appName}} Team</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
                text: `
                    Welcome to {{appName}}!
                    
                    Hello {{name}},
                    
                    Thank you for joining {{appName}}. We're excited to have you on board!
                    
                    To get started, please verify your email address by visiting:
                    {{verificationUrl}}
                    
                    If you didn't create this account, please ignore this email.
                    
                    Best regards,
                    The {{appName}} Team
                `
            },
            
            resetPassword: {
                subject: 'Reset Your Password - {{appName}}',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Reset Password</title>
                        <style>
                            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                            .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
                            .content { padding: 20px; }
                            .button { background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
                            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 4px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Password Reset Request</h1>
                            </div>
                            <div class="content">
                                <h2>Hello {{name}},</h2>
                                <p>We received a request to reset your password for your {{appName}} account.</p>
                                <p>Click the button below to reset your password:</p>
                                <p style="text-align: center;">
                                    <a href="{{resetUrl}}" class="button">Reset Password</a>
                                </p>
                                <div class="warning">
                                    <strong>Security Notice:</strong> This link will expire in {{expirationTime}}. 
                                    If you didn't request this reset, please ignore this email.
                                </div>
                                <p>For security reasons, please do not share this link with anyone.</p>
                                <p>Best regards,<br>The {{appName}} Team</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
                text: `
                    Password Reset Request - {{appName}}
                    
                    Hello {{name}},
                    
                    We received a request to reset your password for your {{appName}} account.
                    
                    Please visit the following link to reset your password:
                    {{resetUrl}}
                    
                    SECURITY NOTICE: This link will expire in {{expirationTime}}.
                    If you didn't request this reset, please ignore this email.
                    
                    For security reasons, please do not share this link with anyone.
                    
                    Best regards,
                    The {{appName}} Team
                `
            },
            
            notification: {
                subject: 'New Notification - {{appName}}',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Notification</title>
                        <style>
                            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                            .header { background: #17a2b8; color: white; padding: 20px; text-align: center; }
                            .content { padding: 20px; }
                            .notification { background: #d1ecf1; border: 1px solid #b6d4da; padding: 15px; margin: 15px 0; border-radius: 4px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>{{notificationType}} Notification</h1>
                            </div>
                            <div class="content">
                                <h2>Hello {{name}},</h2>
                                <div class="notification">
                                    <h3>{{title}}</h3>
                                    <p>{{message}}</p>
                                    {{#actionUrl}}
                                    <p><a href="{{actionUrl}}">{{actionText}}</a></p>
                                    {{/actionUrl}}
                                </div>
                                <p>This notification was sent from {{appName}}.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
                text: `
                    {{notificationType}} Notification - {{appName}}
                    
                    Hello {{name}},
                    
                    {{title}}
                    
                    {{message}}
                    
                    {{#actionUrl}}
                    Action required: {{actionUrl}}
                    {{/actionUrl}}
                    
                    This notification was sent from {{appName}}.
                `
            }
        };
        
        return templates[templateName] || templates.notification;
    }
    
    async sendDirectly(emailData) {
        let attempt = 0;
        const maxAttempts = this.config.retry.attempts;
        
        while (attempt < maxAttempts) {
            try {
                const result = await this.transporter.send(emailData);
                console.log(`Email sent successfully: ${emailData.subject}`);
                return result;
                
            } catch (error) {
                attempt++;
                
                if (attempt >= maxAttempts) {
                    throw error;
                }
                
                console.log(`Email send attempt ${attempt} failed, retrying...`);
                await this.delay(this.config.retry.delay * attempt);
            }
        }
    }
    
    async queueEmail(emailData) {
        this.queue.push(emailData);
        console.log(`Email queued: ${emailData.subject}`);
        
        // In a real implementation, this would add to Redis queue
        return {
            id: Date.now(),
            status: 'queued',
            timestamp: emailData.timestamp
        };
    }
    
    async processQueue() {
        while (this.queue.length > 0) {
            const emailData = this.queue.shift();
            
            try {
                await this.sendDirectly(emailData);
            } catch (error) {
                console.error(`Failed to send queued email: ${emailData.subject}`, error);
                // In a real implementation, failed emails would be handled appropriately
            }
        }
    }
    
    validateEmail(emailData) {
        if (!emailData.to) {
            throw new Error('Email recipient (to) is required');
        }
        
        if (!emailData.subject) {
            throw new Error('Email subject is required');
        }
        
        if (!emailData.html && !emailData.text) {
            throw new Error('Email content (html or text) is required');
        }
        
        // Validate email addresses
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        const validateAddress = (address) => {
            if (typeof address === 'string') {
                return emailRegex.test(address);
            } else if (address && address.email) {
                return emailRegex.test(address.email);
            }
            return false;
        };
        
        if (!validateAddress(emailData.to)) {
            throw new Error('Invalid recipient email address');
        }
        
        if (emailData.cc && !validateAddress(emailData.cc)) {
            throw new Error('Invalid CC email address');
        }
        
        if (emailData.bcc && !validateAddress(emailData.bcc)) {
            throw new Error('Invalid BCC email address');
        }
    }
    
    formatFromAddress() {
        const from = this.config.from;
        return from.name ? `${from.name} <${from.email}>` : from.email;
    }
    
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Convenience methods
    async sendWelcomeEmail(to, data) {
        return await this.sendEmail({
            to,
            template: 'welcome',
            data
        });
    }
    
    async sendPasswordResetEmail(to, data) {
        return await this.sendEmail({
            to,
            template: 'resetPassword',
            data
        });
    }
    
    async sendNotificationEmail(to, data) {
        return await this.sendEmail({
            to,
            template: 'notification',
            data
        });
    }
    
    async close() {
        if (this.transporter && this.transporter.close) {
            await this.transporter.close();
        }
        this.isConnected = false;
    }
}

// Template Renderer
class TemplateRenderer {
    constructor(template, data) {
        this.template = template;
        this.data = data;
    }
    
    async render() {
        return {
            subject: this.renderString(this.template.subject, this.data),
            html: this.renderString(this.template.html, this.data),
            text: this.renderString(this.template.text, this.data)
        };
    }
    
    renderString(template, data) {
        if (!template) return '';
        
        // Simple template rendering (Mustache-like)
        return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const value = this.getNestedValue(data, key.trim());
            return value !== undefined ? value : match;
        }).replace(/\{\{#([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
            const value = this.getNestedValue(data, key.trim());
            return value ? this.renderString(content, data) : '';
        });
    }
    
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }
}

// Transport implementations
class SMTPTransporter {
    constructor(config) {
        this.config = config;
        this.isConnected = false;
    }
    
    async connect() {
        // Simulate SMTP connection
        console.log(`Connecting to SMTP: ${this.config.host}:${this.config.port}`);
        this.isConnected = true;
    }
    
    async send(emailData) {
        if (!this.isConnected) {
            await this.connect();
        }
        
        // Simulate email sending
        console.log(`SMTP: Sending email to ${emailData.to}`);
        
        return {
            messageId: `smtp-${Date.now()}@${this.config.host}`,
            accepted: [emailData.to],
            rejected: [],
            response: '250 Message queued',
            envelope: {
                from: emailData.from,
                to: [emailData.to]
            }
        };
    }
    
    async close() {
        this.isConnected = false;
    }
}

class SendGridTransporter {
    constructor(config) {
        this.config = config;
        this.apiKey = config.apiKey;
    }
    
    async send(emailData) {
        // Simulate SendGrid API call
        console.log(`SendGrid: Sending email to ${emailData.to}`);
        
        return {
            statusCode: 202,
            body: '',
            headers: {
                'x-message-id': `sendgrid-${Date.now()}`
            }
        };
    }
}

class MailgunTransporter {
    constructor(config) {
        this.config = config;
        this.apiKey = config.apiKey;
        this.domain = config.domain;
    }
    
    async send(emailData) {
        // Simulate Mailgun API call
        console.log(`Mailgun: Sending email to ${emailData.to}`);
        
        return {
            id: `mailgun-${Date.now()}`,
            message: 'Queued. Thank you.'
        };
    }
}

class SESTransporter {
    constructor(config) {
        this.config = config;
        this.accessKeyId = config.accessKeyId;
        this.secretAccessKey = config.secretAccessKey;
        this.region = config.region;
    }
    
    async send(emailData) {
        // Simulate AWS SES API call
        console.log(`SES: Sending email to ${emailData.to}`);
        
        return {
            MessageId: `ses-${Date.now()}`,
            ResponseMetadata: {
                RequestId: `request-${Date.now()}`
            }
        };
    }
}

// Email Builder for programmatic email creation
class EmailBuilder {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.emailData = {
            to: null,
            cc: null,
            bcc: null,
            subject: null,
            from: null,
            replyTo: null,
            html: null,
            text: null,
            attachments: [],
            headers: {},
            priority: 'normal'
        };
        return this;
    }
    
    to(address) {
        this.emailData.to = address;
        return this;
    }
    
    cc(address) {
        this.emailData.cc = address;
        return this;
    }
    
    bcc(address) {
        this.emailData.bcc = address;
        return this;
    }
    
    subject(subject) {
        this.emailData.subject = subject;
        return this;
    }
    
    from(address) {
        this.emailData.from = address;
        return this;
    }
    
    replyTo(address) {
        this.emailData.replyTo = address;
        return this;
    }
    
    html(content) {
        this.emailData.html = content;
        return this;
    }
    
    text(content) {
        this.emailData.text = content;
        return this;
    }
    
    attach(attachment) {
        this.emailData.attachments.push(attachment);
        return this;
    }
    
    header(name, value) {
        this.emailData.headers[name] = value;
        return this;
    }
    
    priority(level) {
        this.emailData.priority = level;
        return this;
    }
    
    template(name, data) {
        this.emailData.template = name;
        this.emailData.data = data;
        return this;
    }
    
    build() {
        return { ...this.emailData };
    }
}

module.exports = {
    EmailService,
    TemplateRenderer,
    EmailBuilder,
    SMTPTransporter,
    SendGridTransporter,
    MailgunTransporter,
    SESTransporter
};