CREATE TABLE IF NOT EXISTS `trips` (
  `id` varchar(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `destination` varchar(120) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `default_currencies` json NOT NULL,
  `timezone` varchar(80) NOT NULL DEFAULT 'UTC',
  `notes` text,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_trips_active` (`is_active`, `updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `trip_travelers` (
  `id` varchar(80) NOT NULL,
  `trip_id` varchar(36) NOT NULL,
  `display_name` varchar(120) NOT NULL,
  `display_order` int NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_trip_travelers_trip_order` (`trip_id`, `is_active`, `display_order`),
  CONSTRAINT `fk_trip_travelers_trip`
    FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `trip_route_stops` (
  `id` varchar(36) NOT NULL,
  `trip_id` varchar(36) NOT NULL,
  `city` varchar(120) NOT NULL,
  `country` varchar(120) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_trip_route_stops_order` (`trip_id`, `sort_order`, `city`),
  CONSTRAINT `fk_trip_route_stops_trip`
    FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `currency` enum('EUR', 'SGD', 'MYR') DEFAULT NULL,
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
  `currency` enum('EUR', 'SGD', 'MYR') NOT NULL DEFAULT 'EUR',
  `notes` text,
  `map_query` varchar(255) DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_itinerary_items_order` (`travel_date`, `start_time`, `sort_order`, `id`),
    KEY `idx_itinerary_items_city` (`city`, `travel_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `expenses` (
  `id` varchar(36) NOT NULL,
  `source_type` enum('itinerary', 'booking', 'misc') NOT NULL DEFAULT 'misc',
  `source_id` varchar(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `category` enum('Flight', 'Accommodation', 'Transport', 'Food', 'Attraction', 'Insurance', 'Shopping', 'Other') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` enum('EUR', 'SGD', 'MYR') NOT NULL,
  `paid_by_traveler_id` varchar(80) NOT NULL,
  `settled` tinyint(1) NOT NULL DEFAULT 0,
  `expense_date` date NOT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expenses_source` (`source_type`, `source_id`),
  KEY `idx_expenses_date_currency` (`expense_date`, `currency`),
  KEY `idx_expenses_paid_by` (`paid_by_traveler_id`, `settled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `expense_splits` (
  `id` varchar(36) NOT NULL,
  `expense_id` varchar(36) NOT NULL,
  `traveler_id` varchar(80) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_expense_split_traveler` (`expense_id`, `traveler_id`),
  KEY `idx_expense_splits_traveler` (`traveler_id`),
  CONSTRAINT `fk_expense_split_expense`
    FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `packing_items` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` enum('Documents', 'Clothes', 'Electronics', 'Medicine', 'Toiletries', 'Travel Essentials', 'Shared Items', 'Personal Care', 'Other') NOT NULL,
  `priority` enum('High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
  `notes` text,
  `quantity` int DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_packing_items_grouping` (`category`, `priority`, `sort_order`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `packing_item_traveler_statuses` (
  `id` varchar(36) NOT NULL,
  `item_id` varchar(36) NOT NULL,
  `traveler_id` varchar(80) NOT NULL,
  `status` enum('required', 'packed', 'not_needed') NOT NULL DEFAULT 'required',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_packing_item_traveler` (`item_id`, `traveler_id`),
  KEY `idx_packing_traveler_status` (`traveler_id`, `status`),
  CONSTRAINT `fk_packing_status_item`
    FOREIGN KEY (`item_id`) REFERENCES `packing_items` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_items` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `category` enum('Passport', 'Flight', 'Hotel', 'Insurance', 'Visa / Entry', 'Transport', 'Booking', 'Other') NOT NULL,
  `priority` enum('High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
  `status` enum('Needed', 'Saved', 'Printed', 'Ready', 'Not needed') NOT NULL DEFAULT 'Needed',
  `external_url` varchar(1000) DEFAULT NULL,
  `requires_passcode` tinyint(1) NOT NULL DEFAULT 0,
  `passcode_salt` varchar(64) DEFAULT NULL,
  `passcode_hash` varchar(128) DEFAULT NULL,
  `notes` text,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_document_items_grouping` (`category`, `priority`, `status`, `sort_order`, `title`),
  KEY `idx_document_items_protected` (`requires_passcode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_item_traveler_statuses` (
  `id` varchar(36) NOT NULL,
  `item_id` varchar(36) NOT NULL,
  `traveler_id` varchar(80) NOT NULL,
  `status` enum('required', 'saved', 'not_needed') NOT NULL DEFAULT 'required',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_document_item_traveler` (`item_id`, `traveler_id`),
  KEY `idx_document_traveler_status` (`traveler_id`, `status`),
  CONSTRAINT `fk_document_status_item`
    FOREIGN KEY (`item_id`) REFERENCES `document_items` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
