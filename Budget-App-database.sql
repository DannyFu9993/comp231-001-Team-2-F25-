-- Create database
CREATE DATABASE IF NOT EXISTS budget_app;

USE budget_app;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);
