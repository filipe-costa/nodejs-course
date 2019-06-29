# nodejs-course
This repository contains the NodeJs course application from Maximilian Schwarzmüller on [Udemy](https://www.udemy.com/nodejs-the-complete-guide/), please make sure to check it out!

#### Tools used and learnt
* Mysql instead of MongoDB ( which was used throughout second part of the course )
* Sequelize ORM
* EJS template engine to render html
* NodeMailer ( to send emails when the user signs up and resets password)
* bcrypt ( for password salting and hashing )

#### Key goals
* How cookies and sessions work
* How to use authenticated / protected routes
* How encryption (hashing and salting) protects 
* How to generate CSRF tokens and why they are important to validate user requests when dealing with sensitive information
* How send emails when the user signs up or requests a password reset
* How to use reset tokens with associated expirations date (while storing both with the user information) when reseting user password
* How to use an ORM together with a DB through Model associations
* How to upload/download image files
* How to store files in the filesystem while dynamically generating an url to be stored on the DB associated to other file information (e.g. title, description, price)
* How to dynamically generate PDF files and store them ( working just like above )
* How to use template engines and views to output content to the browser
* How to use validate and sanitize user input data, while handling errors that may occur and display them with flash messages

