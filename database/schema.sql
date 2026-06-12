CREATE DATABASE IF NOT EXISTS `italy_trip_2026`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `italy_trip_2026`;

CREATE TABLE IF NOT EXISTS `reminders` (
  `id` varchar(36) NOT NULL,
  `text` varchar(500) NOT NULL,
  `priority` enum('High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
  `created_by` varchar(80) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reminders_priority_created` (`priority`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `booking_items` (
  `id` varchar(36) NOT NULL,
  `category` enum('Flight', 'Hotel', 'Train', 'Attraction', 'Restaurant', 'Insurance', 'Other') NOT NULL,
  `description` varchar(255) NOT NULL,
  `booking_date` date NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `booked_by` varchar(80) NOT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `currency` enum('EUR', 'SGD') DEFAULT NULL,
  `notes` text,
  `status` enum('Not Booked', 'Pending', 'Booked', 'Paid', 'Cancelled', 'Need Confirmation') NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_booking_items_filters` (`category`, `status`, `booked_by`, `booking_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `itinerary_items` (
  `id` varchar(36) NOT NULL,
  `travel_date` date NOT NULL,
  `city` varchar(80) NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `details` text,
  `transport` text,
  `meal` text,
  `cost_amount` decimal(10,2) DEFAULT NULL,
  `currency` enum('EUR', 'SGD') NOT NULL DEFAULT 'EUR',
  `notes` text,
  `map_query` varchar(255) DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_itinerary_items_order` (`travel_date`, `start_time`, `sort_order`, `id`),
  KEY `idx_itinerary_items_city` (`city`, `travel_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
