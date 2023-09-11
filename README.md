
# URL Shortner with User Panel

The URL Shortener is a backend project developed using Node.js to simplify and streamline the process of managing and sharing web links (shorts). This projects provides a comprehensive set of APIs that empower users to create, delete, and retrieve short links effortlessly. With authentication endpoints for login, signup, confirmation, and password management. Users with the appropriate permissions can not only access all the short links they've created but also have the option to delete them. One of its standout features is the comprehensive visitor statistics. This includes valuable data such as the number of visitors and their which counrty they're from, providing a valuable data about your links.


## Documentation

[Documentation](https://documenter.getpostman.com/view/27529827/2s9Xy5NAkk)


## Demo
- you can use this link to test apis of this project

    [Demo link](https://url-shortner-eu8n.onrender.com/)
## Environment Variables

To run this project, you will need to add the following environment variables to your .env file and ofcourse you have to create you own accounts that you need like atlas mongodb and sendgrid to send emails


`NODE_ENV=development or production`

`ATLAS_DATABASE=`

`PASSWORD_DB=`

`JWT_SECRET=`

`JWT_EXPIRES_IN=90d`

`JWT_COOKIE_EXPIRES_IN=90`

`EMAIL_FROM=`

`SENDGRID_USERNAME=apikey`

`SENDGRID_PASSWORD=`
## Installation

Install This project with npm 
- first make sure you create confing.env in the folder project after downloaded it with the right environment variables
- open the command line

```bash
  cd ./dir_of_this_project
  npm install
  npm run st
```
- open on the brwoser http://127.0.0.1:3000
