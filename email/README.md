# Email Templates

Professional email service with SMTP integration, template rendering, and multiple provider support.

## Features

- **Multiple Email Providers**: SMTP, SendGrid, Mailgun, Amazon SES
- **Template Rendering**: Zero-dependency mustache-like template engine
- **HTML Email Templates**: Professional responsive templates
- **Email Queue Management**: Background processing with retry logic
- **Validation**: Email address and content validation
- **Attachments**: File attachment support
- **Zero Dependencies**: Pure Node.js implementation

## Quick Start

```javascript
const EmailService = require('./email-service');
const HTMLEmailTemplates = require('./html-templates');

// Initialize email service
const emailService = new EmailService({
    transport: 'smtp',
    config: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'your-email@gmail.com',
            pass: 'your-app-password'
        }
    }
});

// Send welcome email
const welcomeHtml = HTMLEmailTemplates.getWelcomeTemplate({
    appName: 'MyApp',
    userName: 'John Doe',
    verificationUrl: 'https://myapp.com/verify?token=abc123',
    primaryColor: '#007bff'
});

await emailService.sendEmail({
    to: 'user@example.com',
    subject: 'Welcome to MyApp!',
    html: welcomeHtml
});
```

## Email Service Usage

### Basic Configuration

```javascript
// SMTP Configuration
const emailService = new EmailService({
    transport: 'smtp',
    config: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'your-email@gmail.com',
            pass: 'your-password'
        }
    }
});

// SendGrid Configuration
const emailService = new EmailService({
    transport: 'sendgrid',
    config: {
        apiKey: 'your-sendgrid-api-key'
    }
});

// Mailgun Configuration
const emailService = new EmailService({
    transport: 'mailgun',
    config: {
        domain: 'your-domain.com',
        apiKey: 'your-mailgun-api-key'
    }
});
```

### Sending Emails

```javascript
// Simple email
await emailService.sendEmail({
    to: 'user@example.com',
    subject: 'Hello World',
    text: 'Hello from EmailService!',
    html: '<h1>Hello from EmailService!</h1>'
});

// Email with attachments
await emailService.sendEmail({
    to: 'user@example.com',
    subject: 'Invoice Attached',
    text: 'Please find your invoice attached.',
    attachments: [
        {
            filename: 'invoice.pdf',
            path: '/path/to/invoice.pdf'
        }
    ]
});

// High priority email
await emailService.sendEmail({
    to: 'urgent@example.com',
    subject: 'Urgent: Action Required',
    text: 'This is an urgent message.',
    priority: 'high'
});
```

### Template Rendering

```javascript
// Built-in templates
const template = emailService.getTemplate('welcome');
const html = emailService.renderTemplate(template, {
    userName: 'John Doe',
    appName: 'MyApp',
    verificationUrl: 'https://myapp.com/verify?token=abc123'
});

// Custom template
const customTemplate = `
<h1>Hello {{userName}}!</h1>
<p>Welcome to {{appName}}. Your role is: {{userRole}}</p>
{{#if verificationRequired}}
<a href="{{verificationUrl}}">Verify Email</a>
{{/if}}
`;

const rendered = emailService.renderTemplate(customTemplate, {
    userName: 'Jane Doe',
    appName: 'MyApp',
    userRole: 'Admin',
    verificationRequired: true,
    verificationUrl: 'https://myapp.com/verify'
});
```

### Email Queue Management

```javascript
// Queue multiple emails
await emailService.queueEmail({
    to: 'user1@example.com',
    subject: 'Newsletter',
    html: newsletterHtml
});

await emailService.queueEmail({
    to: 'user2@example.com',
    subject: 'Newsletter',
    html: newsletterHtml
});

// Process queue (automatically processes in background)
emailService.processQueue();

// Check queue status
const status = emailService.getQueueStatus();
console.log(`Pending: ${status.pending}, Failed: ${status.failed}`);

// Retry failed emails
await emailService.retryFailedEmails();
```

## HTML Email Templates

### Welcome Email

```javascript
const HTMLEmailTemplates = require('./html-templates');

const welcomeHtml = HTMLEmailTemplates.getWelcomeTemplate({
    appName: 'Your App',
    userName: 'John Doe',
    verificationUrl: 'https://yourapp.com/verify?token=abc123',
    logoUrl: 'https://yourapp.com/logo.png',
    primaryColor: '#007bff'
});
```

### Password Reset

```javascript
const resetHtml = HTMLEmailTemplates.getPasswordResetTemplate({
    appName: 'Your App',
    userName: 'John Doe',
    resetUrl: 'https://yourapp.com/reset?token=xyz789',
    expirationTime: '24 hours',
    primaryColor: '#dc3545'
});
```

### Order Confirmation

```javascript
const orderHtml = HTMLEmailTemplates.getOrderConfirmationTemplate({
    appName: 'Your Store',
    userName: 'John Doe',
    orderNumber: '12345',
    orderDate: '2024-01-15',
    items: [
        {
            name: 'Product A',
            description: 'Great product',
            quantity: 2,
            price: 29.99
        }
    ],
    subtotal: 59.98,
    tax: 4.80,
    shipping: 5.99,
    total: 70.77,
    shippingAddress: {
        name: 'John Doe',
        address1: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345'
    },
    trackingUrl: 'https://tracking.com/12345'
});
```

### Newsletter

```javascript
const newsletterHtml = HTMLEmailTemplates.getNewsletterTemplate({
    appName: 'Your Company',
    subject: 'Monthly Newsletter',
    articles: [
        {
            title: 'Article Title',
            excerpt: 'Brief description of the article...',
            url: 'https://yoursite.com/article-1',
            image: 'https://yoursite.com/article-1-image.jpg'
        }
    ],
    unsubscribeUrl: 'https://yoursite.com/unsubscribe'
});
```

### Invoice

```javascript
const invoiceHtml = HTMLEmailTemplates.getInvoiceTemplate({
    appName: 'Your Company',
    invoiceNumber: 'INV-001',
    invoiceDate: '2024-01-15',
    dueDate: '2024-02-15',
    customerInfo: {
        name: 'John Doe',
        company: 'Acme Corp',
        address: '123 Business Ave, Suite 100\nBusiness City, BC 12345',
        email: 'john@acme.com'
    },
    companyInfo: {
        address: '456 Company St\nYour City, YC 67890',
        phone: '(555) 123-4567',
        email: 'billing@yourcompany.com'
    },
    items: [
        {
            description: 'Web Development Services',
            details: 'Front-end and back-end development',
            quantity: 40,
            rate: 125.00
        }
    ],
    subtotal: 5000.00,
    tax: 400.00,
    total: 5400.00,
    notes: 'Payment due within 30 days. Thank you for your business!'
});
```

## Email Builder (Programmatic)

```javascript
const { EmailBuilder } = require('./email-service');

const email = new EmailBuilder()
    .to('user@example.com')
    .subject('Welcome!')
    .header('Welcome to Our Service')
    .paragraph('Thank you for joining us. We\'re excited to have you!')
    .button('Get Started', 'https://app.com/onboarding')
    .separator()
    .paragraph('If you have questions, feel free to contact us.')
    .footer('Best regards, The Team')
    .build();

await emailService.sendEmail(email);
```

## Configuration Options

### SMTP Configuration

```javascript
{
    transport: 'smtp',
    config: {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
            user: 'username',
            pass: 'password'
        },
        // Optional SMTP settings
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000
    }
}
```

### Provider-Specific Settings

```javascript
// SendGrid
{
    transport: 'sendgrid',
    config: {
        apiKey: 'SG.xxx',
        // Optional settings
        timeout: 30000
    }
}

// Mailgun
{
    transport: 'mailgun',
    config: {
        domain: 'mg.example.com',
        apiKey: 'key-xxx',
        // Optional settings
        host: 'api.eu.mailgun.net' // For EU region
    }
}

// Amazon SES
{
    transport: 'ses',
    config: {
        region: 'us-east-1',
        accessKeyId: 'AKIA...',
        secretAccessKey: 'xxx',
        // Optional settings
        apiVersion: '2010-12-01'
    }
}
```

## Error Handling

```javascript
try {
    await emailService.sendEmail({
        to: 'invalid-email',
        subject: 'Test',
        text: 'Test'
    });
} catch (error) {
    if (error.code === 'INVALID_EMAIL') {
        console.log('Invalid email address');
    } else if (error.code === 'SMTP_ERROR') {
        console.log('SMTP server error:', error.message);
    } else {
        console.log('Unknown error:', error);
    }
}
```

## Best Practices

### Email Deliverability

1. **SPF Records**: Set up SPF records for your domain
2. **DKIM Signing**: Enable DKIM signing for authentication
3. **DMARC Policy**: Implement DMARC for email authentication
4. **Reputation Management**: Monitor sender reputation
5. **List Hygiene**: Regularly clean email lists

### Template Design

1. **Mobile First**: Design for mobile devices
2. **Inline CSS**: Use inline styles for better compatibility
3. **Alt Text**: Always include alt text for images
4. **Fallback Fonts**: Use web-safe font stacks
5. **Testing**: Test across multiple email clients

### Performance

1. **Queue Management**: Use email queues for bulk sending
2. **Rate Limiting**: Respect provider rate limits
3. **Retry Logic**: Implement exponential backoff
4. **Monitoring**: Monitor delivery rates and errors
5. **Caching**: Cache compiled templates

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Check credentials and enable "less secure apps" for Gmail
2. **SSL/TLS Issues**: Verify SSL settings match your provider
3. **Rate Limiting**: Implement delays between emails
4. **Spam Filters**: Avoid spam trigger words and improve content
5. **Delivery Issues**: Check DNS records and sender reputation

### Testing

```javascript
// Test email configuration
const isValid = await emailService.testConnection();
console.log('Connection valid:', isValid);

// Validate email address
const isValidEmail = emailService.validateEmail('test@example.com');
console.log('Email valid:', isValidEmail);

// Send test email
await emailService.sendTestEmail('your-email@example.com');
```

## License

This email service is part of the Templates library and is provided as-is for educational and development purposes.