export const ACCOUNT_CREATION_EMAIL = (userName) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Account Created Successfully</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      background-color: #ffffff;
      margin: 50px auto;
      padding: 20px;
      border-radius: 8px;
      width: 90%;
      max-width: 600px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #4CAF50;
    }
    .content {
      font-size: 16px;
      line-height: 1.6;
      color: #333333;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #777777;
      text-align: center;
    }
    .btn {
      display: inline-block;
      padding: 10px 20px;
      margin-top: 20px;
      background-color: #4CAF50;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Personal Finance Tracker!</h1>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>We're excited to have you on board! Your account has been successfully created.</p>
      <p>You can now start tracking your expenses, setting budgets, and managing your finances more effectively.</p>
      <a href="https://your-finance-tracker.com/login" class="btn">Login to Your Account</a>
    </div>
    <div class="footer">
      <p>If you did not sign up for this account, please ignore this email.</p>
      <p>&copy; ${new Date().getFullYear()} Personal Finance Tracker. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

export const ACCOUNT_RESET = (userName, url) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Account Created Successfully</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      background-color: #ffffff;
      margin: 50px auto;
      padding: 20px;
      border-radius: 8px;
      width: 90%;
      max-width: 600px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #4CAF50;
    }
    .content {
      font-size: 16px;
      line-height: 1.6;
      color: #333333;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #777777;
      text-align: center;
    }
    .btn {
      display: inline-block;
      padding: 10px 20px;
      margin-top: 20px;
      background-color: #4CAF50;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You requested For Password Reset/h1>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>Please click on below link to reset the password</p>
      <p>You have only one hour to reset the password </p>
      <a href=${url} class="btn">Login to Your Account</a>
    </div>
    <div class="footer">
      <p>If you did not sign up for this account, please ignore this email.</p>
      <p>&copy; ${new Date().getFullYear()} Personal Finance Tracker. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
