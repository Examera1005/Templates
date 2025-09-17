/**
 * HTML Email Templates
 * Professional email templates for common use cases
 * Responsive design with inline CSS for maximum compatibility
 */

class HTMLEmailTemplates {
    static getWelcomeTemplate(data = {}) {
        const {
            appName = 'Your App',
            userName = 'User',
            verificationUrl = '#',
            logoUrl = '',
            primaryColor = '#007bff',
            secondaryColor = '#6c757d'
        } = data;
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ${appName}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif; line-height: 1.6;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">
        <tr>
            <td style="padding: 20px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: ${primaryColor}; color: #ffffff; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                            ${logoUrl ? `<img src="${logoUrl}" alt="${appName}" style="max-width: 150px; height: auto; margin-bottom: 20px;">` : ''}
                            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Welcome to ${appName}!</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Hello ${userName}!</h2>
                            
                            <p style="color: #666666; font-size: 16px; margin: 0 0 20px 0;">
                                Thank you for joining ${appName}! We're thrilled to have you as part of our community.
                            </p>
                            
                            <p style="color: #666666; font-size: 16px; margin: 0 0 30px 0;">
                                To get started and ensure the security of your account, please verify your email address by clicking the button below:
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="${verificationUrl}" style="display: inline-block; padding: 15px 30px; background-color: #28a745; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Verify Email Address</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #666666; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
                                If the button doesn't work, copy and paste this link into your browser:<br>
                                <a href="${verificationUrl}" style="color: ${primaryColor}; word-break: break-all;">${verificationUrl}</a>
                            </p>
                            
                            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
                            
                            <p style="color: #999999; font-size: 14px; margin: 0;">
                                If you didn't create an account with ${appName}, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
                            <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
                                Best regards,<br>
                                The ${appName} Team
                            </p>
                            <p style="color: #cccccc; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} ${appName}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }
    
    static getPasswordResetTemplate(data = {}) {
        const {
            appName = 'Your App',
            userName = 'User',
            resetUrl = '#',
            expirationTime = '24 hours',
            logoUrl = '',
            primaryColor = '#dc3545'
        } = data;
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - ${appName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif; line-height: 1.6;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">
        <tr>
            <td style="padding: 20px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: ${primaryColor}; color: #ffffff; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                            ${logoUrl ? `<img src="${logoUrl}" alt="${appName}" style="max-width: 150px; height: auto; margin-bottom: 20px;">` : ''}
                            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Password Reset Request</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Hello ${userName},</h2>
                            
                            <p style="color: #666666; font-size: 16px; margin: 0 0 20px 0;">
                                We received a request to reset the password for your ${appName} account.
                            </p>
                            
                            <p style="color: #666666; font-size: 16px; margin: 0 0 30px 0;">
                                Click the button below to create a new password:
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="${resetUrl}" style="display: inline-block; padding: 15px 30px; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Reset Password</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Security Warning -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                                <tr>
                                    <td style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 5px;">
                                        <h3 style="color: #856404; font-size: 18px; margin: 0 0 10px 0;">⚠️ Security Notice</h3>
                                        <p style="color: #856404; font-size: 14px; margin: 0;">
                                            This password reset link will expire in <strong>${expirationTime}</strong>. 
                                            If you didn't request this reset, please ignore this email and your password will remain unchanged.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #666666; font-size: 14px; margin: 20px 0 0 0; text-align: center;">
                                If the button doesn't work, copy and paste this link into your browser:<br>
                                <a href="${resetUrl}" style="color: ${primaryColor}; word-break: break-all;">${resetUrl}</a>
                            </p>
                            
                            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
                            
                            <p style="color: #999999; font-size: 14px; margin: 0;">
                                For your security, please do not share this link with anyone. If you need help, contact our support team.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
                            <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
                                Best regards,<br>
                                The ${appName} Security Team
                            </p>
                            <p style="color: #cccccc; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} ${appName}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }
    
    static getOrderConfirmationTemplate(data = {}) {
        const {
            appName = 'Your Store',
            userName = 'Customer',
            orderNumber = '12345',
            orderDate = new Date().toLocaleDateString(),
            items = [],
            subtotal = 0,
            tax = 0,
            shipping = 0,
            total = 0,
            shippingAddress = {},
            trackingUrl = '',
            logoUrl = '',
            primaryColor = '#28a745'
        } = data;
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - ${appName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif; line-height: 1.6;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">
        <tr>
            <td style="padding: 20px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: ${primaryColor}; color: #ffffff; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                            ${logoUrl ? `<img src="${logoUrl}" alt="${appName}" style="max-width: 150px; height: auto; margin-bottom: 20px;">` : ''}
                            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Order Confirmed!</h1>
                            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for your purchase</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Hello ${userName}!</h2>
                            
                            <p style="color: #666666; font-size: 16px; margin: 0 0 30px 0;">
                                We've received your order and it's being processed. Here are the details:
                            </p>
                            
                            <!-- Order Details -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 5px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="color: #333333; font-weight: bold; padding-bottom: 10px;">Order Number:</td>
                                                <td style="color: #666666; text-align: right; padding-bottom: 10px;">#${orderNumber}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #333333; font-weight: bold; padding-bottom: 10px;">Order Date:</td>
                                                <td style="color: #666666; text-align: right; padding-bottom: 10px;">${orderDate}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Order Items -->
                            <h3 style="color: #333333; font-size: 20px; margin: 0 0 20px 0;">Order Items</h3>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid #eeeeee; border-radius: 5px; margin-bottom: 30px;">
                                <tr style="background-color: #f8f9fa;">
                                    <th style="padding: 15px; text-align: left; color: #333333; font-weight: bold; border-bottom: 1px solid #eeeeee;">Item</th>
                                    <th style="padding: 15px; text-align: center; color: #333333; font-weight: bold; border-bottom: 1px solid #eeeeee;">Qty</th>
                                    <th style="padding: 15px; text-align: right; color: #333333; font-weight: bold; border-bottom: 1px solid #eeeeee;">Price</th>
                                </tr>
                                ${items.map(item => `
                                <tr>
                                    <td style="padding: 15px; color: #666666; border-bottom: 1px solid #f0f0f0;">
                                        <strong>${item.name}</strong>
                                        ${item.description ? `<br><small style="color: #999999;">${item.description}</small>` : ''}
                                    </td>
                                    <td style="padding: 15px; text-align: center; color: #666666; border-bottom: 1px solid #f0f0f0;">${item.quantity}</td>
                                    <td style="padding: 15px; text-align: right; color: #666666; border-bottom: 1px solid #f0f0f0;">$${item.price.toFixed(2)}</td>
                                </tr>
                                `).join('')}
                            </table>
                            
                            <!-- Order Total -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 30px;">
                                <tr>
                                    <td style="text-align: right;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-left: auto;">
                                            <tr>
                                                <td style="padding: 5px 15px 5px 0; color: #666666;">Subtotal:</td>
                                                <td style="padding: 5px 0; color: #666666; text-align: right; width: 80px;">$${subtotal.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 15px 5px 0; color: #666666;">Tax:</td>
                                                <td style="padding: 5px 0; color: #666666; text-align: right;">$${tax.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 15px 5px 0; color: #666666;">Shipping:</td>
                                                <td style="padding: 5px 0; color: #666666; text-align: right;">$${shipping.toFixed(2)}</td>
                                            </tr>
                                            <tr style="border-top: 2px solid #333333;">
                                                <td style="padding: 10px 15px 5px 0; color: #333333; font-weight: bold; font-size: 18px;">Total:</td>
                                                <td style="padding: 10px 0 5px 0; color: #333333; font-weight: bold; font-size: 18px; text-align: right;">$${total.toFixed(2)}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Shipping Address -->
                            ${Object.keys(shippingAddress).length > 0 ? `
                            <h3 style="color: #333333; font-size: 20px; margin: 0 0 15px 0;">Shipping Address</h3>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 5px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px; color: #666666;">
                                        ${shippingAddress.name || ''}<br>
                                        ${shippingAddress.address1 || ''}<br>
                                        ${shippingAddress.address2 ? shippingAddress.address2 + '<br>' : ''}
                                        ${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zip || ''}<br>
                                        ${shippingAddress.country || ''}
                                    </td>
                                </tr>
                            </table>
                            ` : ''}
                            
                            <!-- Tracking -->
                            ${trackingUrl ? `
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 20px auto;">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="${trackingUrl}" style="display: inline-block; padding: 15px 30px; background-color: #17a2b8; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Track Your Order</a>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}
                            
                            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
                            
                            <p style="color: #999999; font-size: 14px; margin: 0; text-align: center;">
                                Questions about your order? Contact our customer support team.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
                            <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
                                Thank you for shopping with us!<br>
                                The ${appName} Team
                            </p>
                            <p style="color: #cccccc; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} ${appName}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }
    
    static getNewsletterTemplate(data = {}) {
        const {
            appName = 'Your Company',
            subject = 'Newsletter',
            articles = [],
            unsubscribeUrl = '#',
            logoUrl = '',
            primaryColor = '#007bff'
        } = data;
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject} - ${appName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif; line-height: 1.6;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">
        <tr>
            <td style="padding: 20px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: ${primaryColor}; color: #ffffff; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                            ${logoUrl ? `<img src="${logoUrl}" alt="${appName}" style="max-width: 150px; height: auto; margin-bottom: 15px;">` : ''}
                            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">${subject}</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            
                            ${articles.map((article, index) => `
                            ${index > 0 ? '<hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">' : ''}
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 30px;">
                                <tr>
                                    ${article.image ? `
                                    <td style="width: 150px; padding-right: 20px; vertical-align: top;">
                                        <img src="${article.image}" alt="${article.title}" style="width: 100%; max-width: 150px; height: auto; border-radius: 5px;">
                                    </td>
                                    ` : ''}
                                    <td style="vertical-align: top;">
                                        <h2 style="color: #333333; font-size: 20px; margin: 0 0 10px 0;">
                                            ${article.url ? `<a href="${article.url}" style="color: #333333; text-decoration: none;">${article.title}</a>` : article.title}
                                        </h2>
                                        <p style="color: #666666; font-size: 14px; margin: 0 0 15px 0;">
                                            ${article.excerpt}
                                        </p>
                                        ${article.url ? `
                                        <a href="${article.url}" style="color: ${primaryColor}; text-decoration: none; font-weight: bold;">Read More →</a>
                                        ` : ''}
                                    </td>
                                </tr>
                            </table>
                            `).join('')}
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
                            <p style="color: #999999; font-size: 14px; margin: 0 0 15px 0;">
                                Thank you for subscribing to our newsletter!<br>
                                The ${appName} Team
                            </p>
                            <p style="color: #cccccc; font-size: 12px; margin: 0 0 10px 0;">
                                © ${new Date().getFullYear()} ${appName}. All rights reserved.
                            </p>
                            <p style="color: #cccccc; font-size: 12px; margin: 0;">
                                <a href="${unsubscribeUrl}" style="color: #cccccc; text-decoration: underline;">Unsubscribe</a> | 
                                <a href="#" style="color: #cccccc; text-decoration: underline;">Update Preferences</a>
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }
    
    static getInvoiceTemplate(data = {}) {
        const {
            appName = 'Your Company',
            invoiceNumber = 'INV-001',
            invoiceDate = new Date().toLocaleDateString(),
            dueDate = new Date().toLocaleDateString(),
            customerInfo = {},
            companyInfo = {},
            items = [],
            subtotal = 0,
            tax = 0,
            total = 0,
            notes = '',
            primaryColor = '#333333'
        } = data;
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNumber} - ${appName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: Arial, sans-serif; line-height: 1.4; color: #333333;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 700px; margin: 0 auto;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding-bottom: 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="vertical-align: top;">
                                        <h1 style="color: ${primaryColor}; font-size: 36px; margin: 0; font-weight: bold;">INVOICE</h1>
                                        <p style="color: #666666; font-size: 16px; margin: 5px 0 0 0;">#${invoiceNumber}</p>
                                    </td>
                                    <td style="text-align: right; vertical-align: top;">
                                        <h2 style="color: ${primaryColor}; font-size: 24px; margin: 0; font-weight: bold;">${appName}</h2>
                                        ${companyInfo.address ? `<p style="color: #666666; font-size: 14px; margin: 5px 0;">${companyInfo.address}</p>` : ''}
                                        ${companyInfo.phone ? `<p style="color: #666666; font-size: 14px; margin: 0;">${companyInfo.phone}</p>` : ''}
                                        ${companyInfo.email ? `<p style="color: #666666; font-size: 14px; margin: 0;">${companyInfo.email}</p>` : ''}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Invoice Details -->
                    <tr>
                        <td style="padding-bottom: 30px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="vertical-align: top; width: 50%;">
                                        <h3 style="color: ${primaryColor}; font-size: 16px; margin: 0 0 10px 0; font-weight: bold;">BILL TO:</h3>
                                        <p style="color: #666666; font-size: 14px; margin: 0; line-height: 1.6;">
                                            ${customerInfo.name || ''}<br>
                                            ${customerInfo.company ? customerInfo.company + '<br>' : ''}
                                            ${customerInfo.address || ''}<br>
                                            ${customerInfo.email || ''}
                                        </p>
                                    </td>
                                    <td style="vertical-align: top; text-align: right;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-left: auto;">
                                            <tr>
                                                <td style="padding: 5px 15px 5px 0; color: #666666; font-weight: bold;">Invoice Date:</td>
                                                <td style="padding: 5px 0; color: #666666;">${invoiceDate}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 15px 5px 0; color: #666666; font-weight: bold;">Due Date:</td>
                                                <td style="padding: 5px 0; color: #666666;">${dueDate}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Items Table -->
                    <tr>
                        <td style="padding-bottom: 30px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse: collapse;">
                                <tr style="background-color: ${primaryColor};">
                                    <th style="padding: 15px; text-align: left; color: #ffffff; font-weight: bold; border: 1px solid ${primaryColor};">Description</th>
                                    <th style="padding: 15px; text-align: center; color: #ffffff; font-weight: bold; border: 1px solid ${primaryColor}; width: 80px;">Qty</th>
                                    <th style="padding: 15px; text-align: right; color: #ffffff; font-weight: bold; border: 1px solid ${primaryColor}; width: 100px;">Rate</th>
                                    <th style="padding: 15px; text-align: right; color: #ffffff; font-weight: bold; border: 1px solid ${primaryColor}; width: 100px;">Amount</th>
                                </tr>
                                ${items.map((item, index) => `
                                <tr style="background-color: ${index % 2 === 0 ? '#f9f9f9' : '#ffffff'};">
                                    <td style="padding: 12px 15px; color: #333333; border: 1px solid #dddddd;">
                                        <strong>${item.description}</strong>
                                        ${item.details ? `<br><small style="color: #666666;">${item.details}</small>` : ''}
                                    </td>
                                    <td style="padding: 12px 15px; text-align: center; color: #333333; border: 1px solid #dddddd;">${item.quantity}</td>
                                    <td style="padding: 12px 15px; text-align: right; color: #333333; border: 1px solid #dddddd;">$${item.rate.toFixed(2)}</td>
                                    <td style="padding: 12px 15px; text-align: right; color: #333333; border: 1px solid #dddddd;">$${(item.quantity * item.rate).toFixed(2)}</td>
                                </tr>
                                `).join('')}
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Totals -->
                    <tr>
                        <td style="padding-bottom: 30px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="width: 60%;"></td>
                                    <td style="width: 40%;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 8px 15px 8px 0; color: #666666; border-bottom: 1px solid #eeeeee;">Subtotal:</td>
                                                <td style="padding: 8px 0; color: #666666; text-align: right; border-bottom: 1px solid #eeeeee;">$${subtotal.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 15px 8px 0; color: #666666; border-bottom: 1px solid #eeeeee;">Tax:</td>
                                                <td style="padding: 8px 0; color: #666666; text-align: right; border-bottom: 1px solid #eeeeee;">$${tax.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 15px 15px 15px 0; color: ${primaryColor}; font-weight: bold; font-size: 18px; border-bottom: 2px solid ${primaryColor};">Total:</td>
                                                <td style="padding: 15px 0; color: ${primaryColor}; font-weight: bold; font-size: 18px; text-align: right; border-bottom: 2px solid ${primaryColor};">$${total.toFixed(2)}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Notes -->
                    ${notes ? `
                    <tr>
                        <td style="padding-bottom: 30px;">
                            <h3 style="color: ${primaryColor}; font-size: 16px; margin: 0 0 10px 0; font-weight: bold;">Notes:</h3>
                            <p style="color: #666666; font-size: 14px; margin: 0; line-height: 1.6;">${notes}</p>
                        </td>
                    </tr>
                    ` : ''}
                    
                    <!-- Footer -->
                    <tr>
                        <td style="text-align: center; padding-top: 20px; border-top: 1px solid #eeeeee;">
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                Thank you for your business!
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }
}

module.exports = HTMLEmailTemplates;