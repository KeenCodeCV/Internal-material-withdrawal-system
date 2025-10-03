CREATE DATABASE IF NOT EXISTS materialflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE materialflow;
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('employee','approver','storekeeper','admin') NOT NULL DEFAULT 'employee',
  department VARCHAR(100),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  min_stock INT NOT NULL DEFAULT 0,
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS stock_ledger (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  type ENUM('RECEIPT','ISSUE','ADJUST') NOT NULL,
  qty INT NOT NULL,
  balance_after INT NOT NULL,
  ref VARCHAR(100),
  note VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT NOT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS requisitions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_no VARCHAR(50) NOT NULL UNIQUE,
  requester_id INT NOT NULL,
  status ENUM('DRAFT','SUBMITTED','APPROVED','REJECTED','ISSUED') NOT NULL DEFAULT 'DRAFT',
  approve_by INT,
  approve_at DATETIME,
  reject_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (approve_by) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS requisition_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requisition_id INT NOT NULL,
  item_id INT NOT NULL,
  qty_request INT NOT NULL,
  qty_approved INT,
  qty_issued INT,
  FOREIGN KEY (requisition_id) REFERENCES requisitions(id),
  FOREIGN KEY (item_id) REFERENCES items(id)
) ENGINE=InnoDB;