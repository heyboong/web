-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 30, 2025 at 11:12 PM
-- Server version: 10.11.10-MariaDB-log
-- PHP Version: 8.3.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `read1`
--

-- --------------------------------------------------------

--
-- Table structure for table `telegram_bots`
--

CREATE TABLE `telegram_bots` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `bot_name` varchar(255) NOT NULL,
  `bot_token` varchar(500) NOT NULL,
  `chat_id` varchar(255) NOT NULL,
  `bot_username` varchar(255) DEFAULT NULL,
  `is_enabled` tinyint(1) DEFAULT 1,
  `is_verified` tinyint(1) DEFAULT 0,
  `webhook_url` varchar(500) DEFAULT NULL,
  `webhook_set_at` timestamp NULL DEFAULT NULL,
  `notify_new_accounts` tinyint(1) DEFAULT 1,
  `notify_website_views` tinyint(1) DEFAULT 0,
  `notify_errors` tinyint(1) DEFAULT 1,
  `messages_sent` int(11) DEFAULT 0,
  `last_message_at` timestamp NULL DEFAULT NULL,
  `last_error` text DEFAULT NULL,
  `last_error_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `telegram_bots`
--

INSERT INTO `telegram_bots` (`id`, `user_id`, `bot_name`, `bot_token`, `chat_id`, `bot_username`, `is_enabled`, `is_verified`, `webhook_url`, `webhook_set_at`, `notify_new_accounts`, `notify_website_views`, `notify_errors`, `messages_sent`, `last_message_at`, `last_error`, `last_error_at`, `created_at`, `updated_at`) VALUES
(2, 3, 'vohuunhan', '8439987957:AAHZmKUoHPr11-zMZDoBdtf_UVjKaUR8-2M', '6793481539', 'gfsdgsdg_bot', 1, 1, 'https://api.scanvia.org/telegram_webhook.php', '2025-09-30 15:05:42', 1, 0, 1, 0, NULL, NULL, NULL, '2025-09-30 15:05:42', '2025-09-30 15:05:42');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `telegram_bots`
--
ALTER TABLE `telegram_bots`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_bot_token` (`bot_token`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_enabled` (`is_enabled`),
  ADD KEY `idx_is_verified` (`is_verified`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `telegram_bots`
--
ALTER TABLE `telegram_bots`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `telegram_bots`
--
ALTER TABLE `telegram_bots`
  ADD CONSTRAINT `telegram_bots_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
