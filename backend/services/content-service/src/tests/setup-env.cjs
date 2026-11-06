process.env.JWT_SECRET ||= require('node:crypto').randomBytes(48).toString('hex');
