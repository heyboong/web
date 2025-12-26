-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.4.3 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for read1
CREATE DATABASE IF NOT EXISTS `read1` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `read1`;

-- Dumping structure for table read1.account_list
CREATE TABLE IF NOT EXISTS `account_list` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `website` int NOT NULL,
  `user_id` int NOT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('wrong-pass','otp-mail','otp-phone','otp-2fa','order-device','require-pass','require-mail','success') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'success',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_website` (`website`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `account_list_ibfk_1` FOREIGN KEY (`website`) REFERENCES `websites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.account_list: ~0 rows (approximately)
INSERT INTO `account_list` (`id`, `username`, `password`, `website`, `user_id`, `ip_address`, `code`, `status`, `created_at`) VALUES
	(3, 'dgsdgdsgdsg', 'gfdsgs', 5, 3, '14.161.125.100', NULL, 'success', '2025-09-27 02:38:23');

-- Dumping structure for table read1.domains
CREATE TABLE IF NOT EXISTS `domains` (
  `id` int NOT NULL AUTO_INCREMENT,
  `domain_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `access_type` enum('public','private') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'public',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `domain_name` (`domain_name`),
  KEY `idx_domain_name` (`domain_name`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_access_type` (`access_type`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `domains_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.domains: ~1 rows (approximately)
INSERT INTO `domains` (`id`, `domain_name`, `description`, `is_active`, `access_type`, `created_by`, `created_at`, `updated_at`) VALUES
	(7, 'facebook.com', '', 1, 'public', 3, '2025-09-27 02:23:53', '2025-09-27 02:23:53');

-- Dumping structure for table read1.domain_users
CREATE TABLE IF NOT EXISTS `domain_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `domain_id` int NOT NULL,
  `user_id` int NOT NULL,
  `granted_by` int DEFAULT NULL,
  `granted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_domain_user` (`domain_id`,`user_id`),
  KEY `granted_by` (`granted_by`),
  KEY `idx_domain_id` (`domain_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `domain_users_ibfk_1` FOREIGN KEY (`domain_id`) REFERENCES `domains` (`id`) ON DELETE CASCADE,
  CONSTRAINT `domain_users_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `domain_users_ibfk_3` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.domain_users: ~0 rows (approximately)

-- Dumping structure for table read1.languages
CREATE TABLE IF NOT EXISTS `languages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `native_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `flag` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '',
  `is_active` tinyint(1) DEFAULT '1',
  `is_rtl` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.languages: ~4 rows (approximately)
INSERT INTO `languages` (`id`, `code`, `name`, `native_name`, `flag`, `is_active`, `is_rtl`, `created_at`, `updated_at`) VALUES
	(1, 'en', 'English', 'English', 'united-kingdom', 1, 0, '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(2, 'ar', 'Arabic', 'العربية', 'saudi', 1, 1, '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(3, 'es', 'Spanish', 'Español', 'spain', 1, 0, '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(4, 'zh-cn', 'Chinese (Simplified)', '简体中文', 'china', 1, 0, '2025-09-23 10:30:43', '2025-09-23 10:30:43');

-- Dumping structure for table read1.language_translations
CREATE TABLE IF NOT EXISTS `language_translations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `language_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `translation_key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `translation_value` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_language_key` (`language_code`,`translation_key`),
  KEY `idx_language_code` (`language_code`),
  KEY `idx_translation_key` (`translation_key`),
  CONSTRAINT `language_translations_ibfk_1` FOREIGN KEY (`language_code`) REFERENCES `languages` (`code`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=237 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.language_translations: ~59 rows (approximately)
INSERT INTO `language_translations` (`id`, `language_code`, `translation_key`, `translation_value`, `created_at`, `updated_at`) VALUES
	(33, 'es', 'nav.dashboards.dashboards', 'Paneles', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(34, 'es', 'nav.dashboards.home', 'Inicio', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(35, 'es', 'nav.admin.admin', 'Administración', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(36, 'es', 'nav.admin.settings', 'Configuración del Sitio', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(37, 'es', 'nav.admin.users', 'Gestión de Usuarios', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(38, 'es', 'nav.admin.tools', 'Gestión de Herramientas', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(39, 'es', 'nav.admin.notifications', 'Gestión de Notificaciones', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(40, 'es', 'nav.admin.userPoints', 'Puntos de Usuario', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(41, 'es', 'nav.admin.userAnalytics', 'Analíticas de Usuario', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(42, 'es', 'nav.admin.toolUsage', 'Uso de Herramientas', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(43, 'es', 'nav.admin.analytics', 'Panel de Analíticas', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(44, 'es', 'nav.admin.language', 'Gestión de Idiomas', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(45, 'es', 'nav.user.analytics', 'Mis Analíticas', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(46, 'es', 'nav.settings.settings', 'Configuración', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(47, 'es', 'nav.settings.general', 'General', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(48, 'es', 'nav.settings.appearance', 'Apariencia', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(49, 'zh-cn', 'nav.dashboards.dashboards', '仪表板', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(50, 'zh-cn', 'nav.dashboards.home', '首页', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(51, 'zh-cn', 'nav.admin.admin', '管理', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(52, 'zh-cn', 'nav.admin.settings', '网站设置', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(53, 'zh-cn', 'nav.admin.users', '用户管理', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(54, 'zh-cn', 'nav.admin.tools', '工具管理', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(55, 'zh-cn', 'nav.admin.notifications', '通知管理', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(56, 'zh-cn', 'nav.admin.userPoints', '用户积分', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(57, 'zh-cn', 'nav.admin.userAnalytics', '用户分析', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(58, 'zh-cn', 'nav.admin.toolUsage', '工具使用', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(59, 'zh-cn', 'nav.admin.analytics', '分析面板', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(61, 'zh-cn', 'nav.user.analytics', '我的分析', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(62, 'zh-cn', 'nav.settings.settings', '设置', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(63, 'zh-cn', 'nav.settings.general', '常规', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(64, 'zh-cn', 'nav.settings.appearance', '外观', '2025-09-23 10:30:43', '2025-09-23 10:30:43'),
	(148, 'en', 'nav.dashboards.dashboards', 'Dashboards', '2025-09-23 13:23:27', '2025-09-23 13:23:27'),
	(149, 'en', 'nav.dashboards.home', 'Home', '2025-09-23 13:23:27', '2025-09-23 13:23:27'),
	(150, 'en', 'nav.admin.admin', 'Admin', '2025-09-23 13:23:27', '2025-09-23 13:23:27'),
	(151, 'en', 'nav.admin.settings', 'Site Settings Updated', '2025-09-23 13:23:27', '2025-09-23 13:24:15'),
	(152, 'en', 'nav.admin.users', 'User Management', '2025-09-23 13:23:27', '2025-09-23 13:23:27'),
	(153, 'en', 'nav.admin.tools', 'Tool Management', '2025-09-23 13:23:27', '2025-09-23 13:23:27'),
	(154, 'en', 'nav.admin.notifications', 'Notification Management', '2025-09-23 13:23:27', '2025-09-23 13:23:27'),
	(155, 'en', 'nav.admin.userPoints', 'User Points', '2025-09-23 13:23:27', '2025-09-23 13:23:27'),
	(156, 'en', 'nav.admin.userAnalytics', 'User Analytics', '2025-09-23 13:23:27', '2025-09-23 13:23:27'),
	(157, 'en', 'nav.admin.analytics', 'Analytics Dashboard', '2025-09-23 13:23:27', '2025-09-23 13:23:27'),
	(159, 'en', 'nav.user.analytics', 'My Analytics', '2025-09-23 13:23:27', '2025-09-23 13:23:27'),
	(160, 'en', 'nav.settings.settings', 'Settings', '2025-09-23 13:23:27', '2025-09-23 13:23:27'),
	(161, 'en', 'nav.settings.general', 'General', '2025-09-23 13:23:27', '2025-09-23 13:23:27'),
	(162, 'en', 'nav.settings.appearance', 'Appearance', '2025-09-23 13:23:27', '2025-09-23 13:23:27'),
	(165, 'en', 'test.new.key', 'Test Value New', '2025-09-23 13:24:15', '2025-09-23 13:24:15'),
	(226, 'ar', 'nav.dashboards.dashboards', 'لوحات التحكم', '2025-09-23 13:50:33', '2025-09-23 13:50:33'),
	(227, 'ar', 'nav.dashboards.home', 'الرئيسية', '2025-09-23 13:50:33', '2025-09-23 13:50:33'),
	(228, 'ar', 'nav.admin.admin', 'الإدارة', '2025-09-23 13:50:33', '2025-09-23 13:50:33'),
	(229, 'ar', 'nav.admin.settings', 'إعدادات الموقع', '2025-09-23 13:50:33', '2025-09-23 13:50:33'),
	(230, 'ar', 'nav.admin.users', 'إدارة المستخدمين', '2025-09-23 13:50:33', '2025-09-23 13:50:33'),
	(231, 'ar', 'nav.admin.tools', 'إدارة الأدوات', '2025-09-23 13:50:33', '2025-09-23 13:50:33'),
	(232, 'ar', 'nav.admin.notifications', 'إدارة الإشعارات', '2025-09-23 13:50:33', '2025-09-23 13:50:33'),
	(234, 'ar', 'nav.settings.settings', 'الإعدادات', '2025-09-23 13:50:33', '2025-09-23 13:50:33'),
	(235, 'ar', 'nav.settings.general', 'عام', '2025-09-23 13:50:33', '2025-09-23 13:50:33'),
	(236, 'ar', 'nav.settings.appearance', 'المظهر', '2025-09-23 13:50:33', '2025-09-23 13:50:33');

-- Dumping structure for table read1.notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('admin','system','promotion','maintenance','update') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'admin',
  `priority` enum('low','medium','high','urgent') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `status` enum('draft','scheduled','sent','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `target_audience` enum('all','new_users','premium_users','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'all',
  `is_read` tinyint(1) DEFAULT '0',
  `sent_at` timestamp NULL DEFAULT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.notifications: ~1 rows (approximately)
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `priority`, `status`, `target_audience`, `is_read`, `sent_at`, `scheduled_at`, `expires_at`, `created_at`, `updated_at`) VALUES
	(17, NULL, 'New 2FA Stole System', 'New method to get victim 2FA code, create website or manage your website and try now!', 'update', 'high', 'sent', 'all', 0, '2025-09-23 17:17:03', NULL, NULL, '2025-09-23 17:17:03', '2025-09-23 17:21:54'),
	(20, 3, '🎁 Daily Bonus Earned!', 'You\'ve earned 10 points from your daily login bonus! Total points: 40', 'promotion', 'medium', 'sent', 'all', 0, '2025-09-27 02:16:07', NULL, NULL, '2025-09-27 02:16:07', '2025-09-27 02:16:07'),
	(21, 3, '🎁 Daily Bonus Earned!', 'You\'ve earned 10 points from your daily login bonus! Total points: 50', 'promotion', 'medium', 'sent', 'all', 0, '2025-09-27 02:22:20', NULL, NULL, '2025-09-27 02:22:20', '2025-09-27 02:22:20'),
	(22, 3, '🎁 Daily Bonus Earned!', 'You\'ve earned 10 points from your daily login bonus! Total points: 60', 'promotion', 'medium', 'sent', 'all', 0, '2025-09-27 02:57:50', NULL, NULL, '2025-09-27 02:57:50', '2025-09-27 02:57:50');

-- Dumping structure for table read1.page_views
CREATE TABLE IF NOT EXISTS `page_views` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `page` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_page` (`page`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.page_views: ~13 rows (approximately)
INSERT INTO `page_views` (`id`, `user_id`, `page`, `duration`, `created_at`) VALUES
	(1, NULL, '/home', 1000, '2025-09-24 13:05:35'),
	(2, 3, 'dashboards-home', 0, '2025-09-24 13:05:44'),
	(3, 3, 'dashboards-home', 0, '2025-09-24 13:05:44'),
	(4, 3, 'dashboards-home', 0, '2025-09-24 13:05:58'),
	(5, 3, 'dashboards-home', 0, '2025-09-24 13:05:58'),
	(6, 3, 'dashboards-home', 0, '2025-09-24 13:06:06'),
	(7, 3, 'dashboards-home', 0, '2025-09-24 13:06:06'),
	(8, 3, 'dashboards-home', 0, '2025-09-24 13:08:25'),
	(9, 3, 'dashboards-home', 0, '2025-09-24 13:08:25'),
	(10, 3, 'dashboards-home', 0, '2025-09-24 13:08:33'),
	(11, 3, 'dashboards-home', 0, '2025-09-24 13:08:33'),
	(12, 3, 'phishing-create', 0, '2025-09-24 13:08:36'),
	(13, 3, 'phishing-dashboard', 0, '2025-09-24 13:08:38');

-- Dumping structure for table read1.phishing_accounts
CREATE TABLE IF NOT EXISTS `phishing_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `website_id` int NOT NULL,
  `user_id` int NOT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `additional_data` json DEFAULT NULL,
  `status` enum('pending','verified','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_website_id` (`website_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `phishing_accounts_ibfk_1` FOREIGN KEY (`website_id`) REFERENCES `phishing_websites` (`id`) ON DELETE CASCADE,
  CONSTRAINT `phishing_accounts_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.phishing_accounts: ~0 rows (approximately)

-- Dumping structure for table read1.phishing_websites
CREATE TABLE IF NOT EXISTS `phishing_websites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','inactive','suspended') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `user_id` int NOT NULL,
  `template_id` int DEFAULT NULL,
  `domain_id` int DEFAULT NULL,
  `view_count` int DEFAULT '0',
  `success_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_template_id` (`template_id`),
  KEY `idx_domain_id` (`domain_id`),
  CONSTRAINT `phishing_websites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `phishing_websites_ibfk_2` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `phishing_websites_ibfk_3` FOREIGN KEY (`domain_id`) REFERENCES `domains` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.phishing_websites: ~0 rows (approximately)

-- Dumping structure for table read1.site_settings
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `setting_type` enum('string','number','boolean','json') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `description` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_public` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=574 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.site_settings: ~12 rows (approximately)
INSERT INTO `site_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `is_public`, `created_at`, `updated_at`) VALUES
	(1, 'site_name', 'Scanvia', 'string', 'The name of the website', 1, '2025-09-21 15:47:38', '2025-09-22 02:33:41'),
	(2, 'site_description', 'Your business analytics platform', 'string', 'Brief description of the website', 1, '2025-09-21 15:47:38', '2025-09-22 02:47:49'),
	(3, 'site_url', 'http://localhost:2324', 'string', 'The main URL of the website', 1, '2025-09-21 15:47:38', '2025-09-24 12:40:57'),
	(4, 'admin_email', 'admin@scanvia.org', 'string', 'Administrator email address', 0, '2025-09-21 15:47:38', '2025-09-22 02:33:41'),
	(5, 'maintenance_mode', 'false', 'boolean', 'Enable maintenance mode to disable site access', 1, '2025-09-21 15:47:38', '2025-09-22 02:33:41'),
	(6, 'allow_registration', 'true', 'boolean', 'Allow new users to register accounts', 0, '2025-09-21 15:47:38', '2025-09-22 02:33:41'),
	(7, 'max_users', '1000', 'number', 'Maximum number of users allowed', 0, '2025-09-21 15:47:38', '2025-09-22 02:47:49'),
	(8, 'session_timeout', '30', 'number', 'Session timeout in minutes', 0, '2025-09-21 15:47:38', '2025-09-22 02:33:41'),
	(9, 'theme', 'light', 'string', 'Default theme (light, dark, auto)', 0, '2025-09-21 15:47:38', '2025-09-22 02:33:41'),
	(10, 'language', 'en', 'string', 'Default language', 0, '2025-09-21 15:47:38', '2025-09-22 02:33:41'),
	(11, 'timezone', 'UTC', 'string', 'Default timezone', 0, '2025-09-21 15:47:38', '2025-09-22 02:33:41'),
	(12, 'notifications', '{"email": true, "push": false, "sms": false}', 'json', 'Notification preferences', 0, '2025-09-21 15:47:38', '2025-09-22 02:47:49');

-- Dumping structure for table read1.templates
CREATE TABLE IF NOT EXISTS `templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `thumbnail` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('phishing','login') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'phishing',
  `content_html` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `content_css` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `content_js` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_shared` tinyint(1) DEFAULT '0',
  `approval_status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'approved',
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `submitted_for_approval_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_approval_status` (`approval_status`),
  KEY `idx_is_shared` (`is_shared`),
  KEY `idx_approved_by` (`approved_by`),
  CONSTRAINT `fk_templates_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `templates_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.templates: ~2 rows (approximately)
INSERT INTO `templates` (`id`, `name`, `description`, `thumbnail`, `type`, `content_html`, `content_css`, `content_js`, `is_active`, `created_by`, `created_at`, `updated_at`, `is_shared`, `approval_status`, `approved_by`, `approved_at`, `submitted_for_approval_at`, `rejection_reason`) VALUES
	(3, 'Voting System 2025 Simple', 'Voting System 2025 Simple', 'uploads/template/template-thumb-1758686609766-934616924.jpg', 'phishing', '<!DOCTYPE html>\n<html lang="vi">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Cuộc Thi Thí Sinh Thanh Lịch 2024</title>\n\n  <!-- Bootstrap -->\n  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">\n  <!-- Font -->\n  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">\n  <!-- Icons -->\n  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">\n\n  <style>\n    :root {\n      --primary: #6366f1;\n      --secondary: #8b5cf6;\n      --gradient: linear-gradient(135deg, #6366f1, #8b5cf6);\n      --text-dark: #1e293b;\n      --text-light: #6b7280;\n    }\n    body { font-family: \'Inter\', sans-serif; background: #f9fafb; color: var(--text-dark); }\n\n    /* Navbar */\n    .navbar { box-shadow: 0 2px 8px rgba(0,0,0,0.05); }\n    .navbar-brand { font-weight: 800; font-size: 1.4rem; color: var(--primary) !important; }\n\n    /* Banner */\n    .banner {\n      position: relative;\n      background: url("https://images.unsplash.com/photo-1531315630201-bb15abeb1657?auto=format&fit=crop&w=1600&q=80") center/cover no-repeat;\n      padding: 120px 20px;\n      text-align: center;\n      color: white;\n    }\n    .banner::after {\n      content: "";\n      position: absolute; inset: 0;\n      background: rgba(0,0,0,0.55);\n    }\n    .banner .content {\n      position: relative; z-index: 2;\n      max-width: 800px; margin: auto;\n    }\n    .banner h1 { font-size: 3rem; font-weight: 800; margin-bottom: 1rem; }\n    .banner p { font-size: 1.2rem; margin-bottom: 2rem; }\n    .banner .btn-primary {\n      background: var(--gradient); border: none; padding: 12px 28px;\n      border-radius: 40px; font-weight: 600;\n    }\n\n    /* Section title */\n    .section-title { text-align: center; font-size: 2.2rem; font-weight: 800; margin-bottom: .5rem; }\n    .section-subtitle { text-align: center; color: var(--text-light); margin-bottom: 3rem; }\n\n    /* Contestant cards */\n    .contestant-card {\n      position: relative;\n      border-radius: 18px;\n      overflow: hidden;\n      box-shadow: 0 6px 18px rgba(0,0,0,0.08);\n      transition: transform .3s;\n    }\n    .contestant-card:hover { transform: translateY(-8px); }\n    .contestant-card img {\n      width: 100%; height: 420px; object-fit: cover;\n      transition: transform .4s;\n    }\n    .contestant-card:hover img { transform: scale(1.05); }\n    .contestant-info {\n      position: absolute; bottom: 0; left: 0; right: 0;\n      padding: 20px;\n      background: linear-gradient(180deg, transparent, rgba(0,0,0,.7));\n      color: white;\n      text-align: center;\n    }\n    .contestant-name { font-weight: 700; font-size: 1.3rem; margin-bottom: 6px; }\n    .vote-count { font-size: .95rem; margin-bottom: 12px; }\n    .vote-btn {\n      background: var(--gradient); border: none; padding: 8px 18px;\n      border-radius: 30px; font-weight: 600; font-size: .95rem;\n      color: white; transition: all .3s;\n    }\n    .vote-btn:hover { opacity: 0.9; transform: scale(1.05); }\n\n    /* Top 3 Ranking */\n    .ranking {\n      background: white;\n      border-radius: 16px;\n      padding: 40px 20px;\n      box-shadow: 0 6px 16px rgba(0,0,0,0.08);\n      margin-top: 60px;\n    }\n    .ranking h3 { font-size: 1.5rem; font-weight: 700; margin-bottom: 20px; }\n    .podium { display: flex; justify-content: center; align-items: flex-end; gap: 20px; }\n    .podium-item {\n      flex: 1; text-align: center; background: #f3f4f6;\n      border-radius: 12px; padding: 20px 10px;\n    }\n    .podium-item img {\n      width: 100px; height: 140px; object-fit: cover; border-radius: 8px;\n      margin-bottom: 10px;\n    }\n    .podium-1 { background: #eef2ff; }\n    .podium-2 { background: #fef9c3; }\n    .podium-3 { background: #fef2f2; }\n    .podium-name { font-weight: 600; margin-bottom: 5px; }\n    .podium-votes { font-size: .9rem; color: var(--text-light); }\n\n    /* Footer */\n    .footer { margin-top: 80px; padding: 40px 0; background: #1e293b; color: white; text-align: center; }\n\n    /* Responsive */\n    @media (max-width: 768px) {\n      .banner h1 { font-size: 2rem; }\n      .banner p { font-size: 1rem; }\n      .contestant-card img { height: 340px; }\n      .podium { flex-direction: column; }\n    }\n  </style>\n</head>\n<body>\n  <!-- Navbar -->\n  <nav class="navbar navbar-expand-lg bg-white fixed-top">\n    <div class="container">\n      <a class="navbar-brand" href="#"><i class="bi bi-gem me-2"></i>Thanh Lịch 2024</a>\n      <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#navMenu">\n        <span class="navbar-toggler-icon"></span>\n      </button>\n      <div class="collapse navbar-collapse" id="navMenu">\n        <ul class="navbar-nav ms-auto">\n          <li class="nav-item"><a href="#home" class="nav-link">Trang Chủ</a></li>\n          <li class="nav-item"><a href="#voting" class="nav-link">Bình Chọn</a></li>\n          <li class="nav-item"><a href="#ranking" class="nav-link">Xếp Hạng</a></li>\n        </ul>\n      </div>\n    </div>\n  </nav>\n\n  <!-- Banner -->\n  <section class="banner" id="home">\n    <div class="content">\n      <h1>Cuộc Thi Thí Sinh Thanh Lịch 2024</h1>\n      <p>Tôn vinh phong cách – tài năng – thanh lịch. Hãy bình chọn cho thí sinh bạn yêu thích nhất!</p>\n      <a href="#voting" class="btn btn-primary">Bắt đầu bình chọn</a>\n    </div>\n  </section>\n\n  <!-- Voting -->\n  <section class="voting-section py-5" id="voting">\n    <div class="container">\n      <h2 class="section-title">Danh Sách Thí Sinh</h2>\n      <p class="section-subtitle">Click vào nút bình chọn để ủng hộ thí sinh.</p>\n      <div class="row g-4" id="contestants-container"></div>\n    </div>\n  </section>\n\n  <!-- Ranking -->\n  <section class="ranking container" id="ranking">\n    <h3 class="text-center">🏆 Top 3 Thí Sinh Dẫn Đầu</h3>\n    <div class="podium" id="ranking-container"></div>\n  </section>\n\n  <!-- Footer -->\n  <footer class="footer">\n    <div class="container">\n      <p>© 2024 Cuộc Thi Thí Sinh Thanh Lịch. All rights reserved.</p>\n    </div>\n  </footer>\n\n  <!-- Bootstrap JS -->\n  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>\n\n  <!-- Custom JS -->\n  <script>\n    const contestants = [\n      { id: 1, name: "Nguyễn Văn A", image: "https://i.pravatar.cc/400?img=12", votes: 0 },\n      { id: 2, name: "Trần Thị B", image: "https://i.pravatar.cc/400?img=32", votes: 0 },\n      { id: 3, name: "Lê Văn C", image: "https://i.pravatar.cc/400?img=45", votes: 0 },\n      { id: 4, name: "Phạm Thị D", image: "https://i.pravatar.cc/400?img=25", votes: 0 },\n      { id: 5, name: "Hoàng Văn E", image: "https://i.pravatar.cc/400?img=19", votes: 0 },\n      { id: 6, name: "Ngô Thị F", image: "https://i.pravatar.cc/400?img=47", votes: 0 }\n    ];\n\n    function renderContestants() {\n      const container = document.getElementById("contestants-container");\n      container.innerHTML = "";\n      contestants.forEach(c => {\n        const col = document.createElement("div");\n        col.className = "col-lg-4 col-md-6";\n        col.innerHTML = `\n          <div class="contestant-card">\n            <img src="${c.image}" alt="${c.name}">\n            <div class="contestant-info">\n              <div class="contestant-name">${c.name}</div>\n              <div class="vote-count"><span id="votes-${c.id}">${c.votes}</span> phiếu</div>\n              <button class="vote-btn" onclick="vote(${c.id}, this)">Bình chọn</button>\n            </div>\n          </div>\n        `;\n        container.appendChild(col);\n      });\n    }\n\n    function updateRanking() {\n      const sorted = [...contestants].sort((a,b) => b.votes - a.votes).slice(0,3);\n      const container = document.getElementById("ranking-container");\n      container.innerHTML = "";\n      sorted.forEach((c,i) => {\n        const div = document.createElement("div");\n        div.className = `podium-item podium-${i+1}`;\n        div.innerHTML = `\n          <img src="${c.image}" alt="${c.name}">\n          <div class="podium-name">${c.name}</div>\n          <div class="podium-votes">${c.votes} phiếu</div>\n        `;\n        container.appendChild(div);\n      });\n    }\n\n    function vote(id, btn) {\n      const c = contestants.find(x => x.id === id);\n      c.votes++;\n      document.getElementById(`votes-${id}`).innerText = c.votes;\n      btn.classList.add("vote-success");\n      setTimeout(() => btn.classList.remove("vote-success"), 300);\n      updateRanking();\n    }\n\n    renderContestants();\n    updateRanking();\n  </script>\n</body>\n</html>\n', '/* Custom Template Styles */\nbody {\n    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n    min-height: 100vh;\n    padding: 20px 0;\n}\n\n.card {\n    border: none;\n    border-radius: 15px;\n    backdrop-filter: blur(10px);\n    background: rgba(255, 255, 255, 0.95);\n}\n\n.card-body {\n    padding: 2rem;\n}\n\n.btn-primary {\n    background: linear-gradient(45deg, #667eea, #764ba2);\n    border: none;\n    border-radius: 25px;\n    padding: 12px 30px;\n    font-weight: 600;\n    transition: all 0.3s ease;\n}\n\n.btn-primary:hover {\n    transform: translateY(-2px);\n    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);\n}', '// Template JavaScript\ndocument.addEventListener(\'DOMContentLoaded\', function() {\n    console.log(\'Template loaded successfully\');\n    \n    // Button interactions\n    const buttons = document.querySelectorAll(\'.btn\');\n    buttons.forEach(button => {\n        button.addEventListener(\'click\', function() {\n            this.style.transform = \'scale(0.95)\';\n            setTimeout(() => {\n                this.style.transform = \'scale(1)\';\n            }, 150);\n            \n            console.log(\'Button clicked:\', this.textContent);\n        });\n    });\n});\n\n// Login function for redirecting to login page\nfunction Login() {\n    // Redirect to login page\n    window.location.href = \'/auth/signin\';\n}', 1, 3, '2025-09-24 04:01:55', '2025-09-24 04:03:30', 1, 'approved', NULL, NULL, NULL, NULL),
	(4, 'Facebook Vietnamese Version', 'FB Vietnamese login ver', 'uploads/template/template-thumb-1758689229099-903212806.jpg', 'login', '<html lang="vi">\n <head>\n  <meta charset="utf-8"/>\n  <meta content="width=device-width, initial-scale=1" name="viewport"/>\n  <title>\n   Facebook Login\n  </title>\n  <script src="https://cdn.tailwindcss.com">\n  </script>\n  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet"/>\n  <style>\n   @import url(\'https://fonts.googleapis.com/css2?family=Roboto&display=swap\');\n    body {\n      font-family: \'Roboto\', sans-serif;\nfont-size:16px;\n    }\n.text-base{\nfont-size:15px!important;}button.mt-3.text-blue.font-semibold.text-base {\n    color: #4864e2;\n    font-weight: 500;\n}input.w-full.border {\n    height: 48px;\n}\n  </style>\n </head>\n <body class="bg-white min-h-screen flex flex-col justify-between">\n  <div class="pt-1 px-4 max-w-md mx-auto w-full">\n \n  </div>\n  <div class="flex flex-col items-center px-4 max-w-md mx-auto w-full">\n   <img alt="Blue circle with white lowercase letter f representing Facebook logo" class="my-20" height="50" src="https://z-m-static.xx.fbcdn.net/rsrc.php/v4/yD/r/5D8s-GsHJlJ.png" width="50"/>\n   <form class="w-full space-y-4">\n    <input class="w-full border border-gray-300 rounded-xl py-3 px-3 text-gray-600 text-base focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Số di động hoặc email" type="text"/>\n    <input class="w-full border border-gray-300 rounded-xl py-3 px-3 text-gray-600 text-base focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Mật khẩu" type="password"/>\n    <button class="w-full bg-blue-600 text-white font-semibold rounded-full py-2 text-base" type="submit">\n     Đăng nhập\n    </button>\n   </form>\n   <button aria-label="Forgot password" class="mt-3 text-blue font-semibold text-base" type="button">\n    Quên mật khẩu?\n   </button>\n  </div>\n  <div class="px-4 max-w-md mx-auto w-full mb-8">\n  \n   <div class="flex justify-center items-center mt-6 space-x-2 text-gray-600 text-sm font-normal">\n    <img alt="Infinity symbol in gray representing Meta logo" height="20" src="https://z-m-static.xx.fbcdn.net/rsrc.php/v4/yK/r/soeuNpXL37G.png" width="50"/>\n   \n   </div>\n  </div>\n </body>\n</html>\n', '', '', 1, 3, '2025-09-24 04:47:11', '2025-09-24 04:47:11', 1, 'approved', NULL, NULL, NULL, NULL);

-- Dumping structure for table read1.template_fields
CREATE TABLE IF NOT EXISTS `template_fields` (
  `id` int NOT NULL AUTO_INCREMENT,
  `template_id` int NOT NULL,
  `field_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_type` enum('text','password','email','tel','number','url') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'text',
  `field_label` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `field_placeholder` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `max_length` int DEFAULT '255',
  `is_required` tinyint(1) DEFAULT '0',
  `field_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_template_field` (`template_id`,`field_name`),
  KEY `idx_template_id` (`template_id`),
  CONSTRAINT `template_fields_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.template_fields: ~2 rows (approximately)
INSERT INTO `template_fields` (`id`, `template_id`, `field_name`, `field_type`, `field_label`, `field_placeholder`, `max_length`, `is_required`, `field_order`, `created_at`, `updated_at`) VALUES
	(1, 4, 'Tài khoản', 'text', 'Email hoặc số điện thoại', '', 255, 1, 0, '2025-09-27 02:05:07', '2025-09-27 02:05:07'),
	(2, 4, 'Mật khẩu', 'password', 'Mật khẩu', 'Mật khẩu', 255, 0, 1, '2025-09-27 02:05:21', '2025-09-27 02:05:21');

-- Dumping structure for table read1.tools
CREATE TABLE IF NOT EXISTS `tools` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `category` enum('seo','development','design','analytics','productivity','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'other',
  `status` enum('active','inactive','maintenance') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `price` decimal(10,2) DEFAULT '0.00',
  `points_cost` int DEFAULT '0',
  `icon` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '?',
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT '0',
  `usage_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`),
  KEY `idx_is_featured` (`is_featured`),
  KEY `idx_usage_count` (`usage_count`)
) ENGINE=InnoDB AUTO_INCREMENT=116 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.tools: ~1 rows (approximately)
INSERT INTO `tools` (`id`, `name`, `description`, `category`, `status`, `price`, `points_cost`, `icon`, `url`, `is_featured`, `usage_count`, `created_at`, `updated_at`) VALUES
	(74, 'Strong Password Generator', 'Create strong password to protect your account', 'other', 'active', 0.00, 0, 'uploads/tools/tool-icon-1758611165392-932692232.png', '/tool/strong-password-generator', 0, 20, '2025-09-23 07:06:05', '2025-09-27 02:08:05');

-- Dumping structure for table read1.tool_usage
CREATE TABLE IF NOT EXISTS `tool_usage` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `tool_id` int NOT NULL,
  `used_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `session_duration` int DEFAULT '0',
  `success` tinyint(1) DEFAULT '1',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_tool_id` (`tool_id`),
  KEY `idx_used_at` (`used_at`),
  KEY `idx_user_tool` (`user_id`,`tool_id`),
  CONSTRAINT `tool_usage_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tool_usage_ibfk_2` FOREIGN KEY (`tool_id`) REFERENCES `tools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=148 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.tool_usage: ~10 rows (approximately)
INSERT INTO `tool_usage` (`id`, `user_id`, `tool_id`, `used_at`, `session_duration`, `success`, `notes`) VALUES
	(136, 3, 74, '2025-09-23 10:15:59', 0, 1, 'Tool viewed'),
	(137, 3, 74, '2025-09-23 13:23:16', 0, 1, 'Tool viewed'),
	(138, 3, 74, '2025-09-23 13:41:42', 0, 1, 'Tool viewed'),
	(139, 3, 74, '2025-09-23 17:18:31', 0, 1, 'Tool viewed'),
	(140, 3, 74, '2025-09-23 17:18:41', 0, 1, 'Tool viewed'),
	(141, 3, 74, '2025-09-23 17:18:42', 0, 1, 'Tool viewed'),
	(142, 3, 74, '2025-09-24 10:16:53', 0, 1, 'Tool viewed'),
	(143, 3, 74, '2025-09-24 10:16:53', 0, 1, 'Tool viewed'),
	(144, 3, 74, '2025-09-24 10:27:30', 0, 1, 'Tool viewed'),
	(145, 3, 74, '2025-09-24 10:27:31', 0, 1, 'Tool viewed'),
	(146, 3, 74, '2025-09-27 02:08:05', 0, 1, 'Tool viewed'),
	(147, 3, 74, '2025-09-27 02:08:05', 0, 1, 'Tool viewed');

-- Dumping structure for table read1.transaction_history
CREATE TABLE IF NOT EXISTS `transaction_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `transaction_type` enum('deposit','withdrawal','admin_adjustment','product_purchase','refund','bonus') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `balance_before` decimal(10,2) NOT NULL,
  `balance_after` decimal(10,2) NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` int DEFAULT NULL,
  `admin_user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_transaction_type` (`transaction_type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_admin_user_id` (`admin_user_id`),
  CONSTRAINT `transaction_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transaction_history_ibfk_2` FOREIGN KEY (`admin_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.transaction_history: ~5 rows (approximately)
INSERT INTO `transaction_history` (`id`, `user_id`, `transaction_type`, `amount`, `balance_before`, `balance_after`, `description`, `reference_id`, `admin_user_id`, `created_at`) VALUES
	(1, 3, 'deposit', 50.00, 100.75, 150.75, 'Test deposit 1', NULL, NULL, '2025-09-23 04:17:42'),
	(2, 3, 'admin_adjustment', 25.00, 100.75, 125.75, 'Test admin add', NULL, NULL, '2025-09-23 04:17:42'),
	(3, 3, 'product_purchase', -15.00, 100.75, 85.75, 'Test purchase', NULL, NULL, '2025-09-23 04:17:42'),
	(4, 3, 'admin_adjustment', 200.00, 100.75, 300.75, 'Admin balance adjustment', NULL, 3, '2025-09-23 05:19:59'),
	(5, 3, 'admin_adjustment', 60.00, 300.75, 360.75, 'Admin balance adjustment', NULL, 3, '2025-09-23 10:30:06');

-- Dumping structure for table read1.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `balance` decimal(10,2) DEFAULT '0.00',
  `points` int DEFAULT '0',
  `last_daily_bonus` date DEFAULT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `is_admin` tinyint(1) DEFAULT '0',
  `email_verified` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `admin` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.users: ~1 rows (approximately)
INSERT INTO `users` (`id`, `username`, `email`, `balance`, `points`, `last_daily_bonus`, `password_hash`, `first_name`, `last_name`, `phone`, `avatar`, `bio`, `is_active`, `is_admin`, `email_verified`, `created_at`, `updated_at`, `admin`) VALUES
	(3, 'vohuunhan', 'qbasrapvungjcasju503@gmail.com', 360.75, 60, '2025-09-27', '$2b$12$mPlUK8PJyTWC7uWPdrcQZ.U9Ob8R34c63QGUIShNFjNVl33vBEV1G', 'Vo', 'Huu Nhan', '0939837584', '/uploads/avatars/avatar-3-1758938878461.webp', 'Anh Thu', 1, 1, 0, '2025-09-21 13:20:45', '2025-09-27 02:57:50', 0);

-- Dumping structure for table read1.user_analytics
CREATE TABLE IF NOT EXISTS `user_analytics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `balance` decimal(10,2) DEFAULT '0.00',
  `total_balance` decimal(10,2) DEFAULT '0.00',
  `points` int DEFAULT '0',
  `tool_use_count` int DEFAULT '0',
  `page_views` int DEFAULT '0',
  `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_analytics` (`user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_last_activity` (`last_activity`),
  CONSTRAINT `user_analytics_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1597 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.user_analytics: ~1 rows (approximately)
INSERT INTO `user_analytics` (`id`, `user_id`, `balance`, `total_balance`, `points`, `tool_use_count`, `page_views`, `last_activity`, `created_at`, `updated_at`) VALUES
	(5, 3, 0.00, 335.00, 0, 1, 1506, '2025-09-27 05:54:17', '2025-09-22 03:04:01', '2025-09-27 05:54:17');

-- Dumping structure for table read1.user_balance_transactions
CREATE TABLE IF NOT EXISTS `user_balance_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `transaction_type` enum('deposit','withdrawal','tool_purchase','refund','bonus') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'deposit',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_transaction_type` (`transaction_type`),
  CONSTRAINT `user_balance_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.user_balance_transactions: ~0 rows (approximately)

-- Dumping structure for view read1.user_dashboard_analytics
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `user_dashboard_analytics` (
	`user_id` INT NULL,
	`username` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`balance` DECIMAL(10,2) NOT NULL,
	`total_balance` DECIMAL(10,2) NOT NULL,
	`points` BIGINT NOT NULL,
	`tool_use_count` BIGINT NOT NULL,
	`last_activity` TIMESTAMP NULL,
	`unread_notifications` BIGINT NULL
) ENGINE=MyISAM;

-- Dumping structure for table read1.user_points_transactions
CREATE TABLE IF NOT EXISTS `user_points_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `points_change` int NOT NULL,
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_type` enum('tool_usage','purchase','bonus','admin_adjustment') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'tool_usage',
  `reference_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_reference_type` (`reference_type`),
  CONSTRAINT `user_points_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.user_points_transactions: ~1 rows (approximately)
INSERT INTO `user_points_transactions` (`id`, `user_id`, `points_change`, `reason`, `reference_type`, `reference_id`, `created_at`) VALUES
	(3, 3, 10, 'Daily login bonus', 'bonus', NULL, '2025-09-24 00:26:50'),
	(4, 3, 10, 'Daily login bonus', 'bonus', NULL, '2025-09-27 02:02:42'),
	(5, 3, 10, 'Daily login bonus', 'bonus', NULL, '2025-09-27 02:16:07'),
	(6, 3, 10, 'Daily login bonus', 'bonus', NULL, '2025-09-27 02:22:20'),
	(7, 3, 10, 'Daily login bonus', 'bonus', NULL, '2025-09-27 02:57:50');

-- Dumping structure for view read1.user_recent_tools
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `user_recent_tools` (
	`id` INT NOT NULL,
	`name` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`description` TEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`icon` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`url` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`category` ENUM('seo','development','design','analytics','productivity','other') NULL COLLATE 'utf8mb4_unicode_ci',
	`uses` BIGINT NOT NULL,
	`last_used` TIMESTAMP NULL,
	`hours_ago` BIGINT NULL
) ENGINE=MyISAM;

-- Dumping structure for table read1.websites
CREATE TABLE IF NOT EXISTS `websites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `redirect_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `temp1` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `temp2` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `thumbnail` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `language` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'en',
  `domain` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` int NOT NULL,
  `view_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `phishing_template_id` int DEFAULT NULL,
  `login_template_id` int DEFAULT NULL,
  `temp1_css` text COLLATE utf8mb4_unicode_ci,
  `temp1_js` text COLLATE utf8mb4_unicode_ci,
  `temp2_css` text COLLATE utf8mb4_unicode_ci,
  `temp2_js` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_slug` (`slug`),
  KEY `idx_websites_domain` (`domain`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table read1.websites: ~1 rows (approximately)
INSERT INTO `websites` (`id`, `title`, `description`, `slug`, `redirect_url`, `temp1`, `temp2`, `thumbnail`, `language`, `domain`, `user_id`, `view_count`, `created_at`, `updated_at`, `phishing_template_id`, `login_template_id`, `temp1_css`, `temp1_js`, `temp2_css`, `temp2_js`) VALUES
	(3, 'Debug Test', 'Testing SQL parameters', 'debug-test-sql-3', 'https://example.com', '', '', '', 'en', '', 1, 0, '2025-09-24 07:14:18', '2025-09-24 07:14:18', NULL, NULL, NULL, NULL, NULL, NULL),
	(5, 'fhfdh', 'dfhdfhfd', 'fhfdhdfhfdh', 'hdfhdfhfdh', '<!DOCTYPE html>\n<html lang="vi">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Cuộc Thi Thí Sinh Thanh Lịch 2024</title>\n\n  <!-- Bootstrap -->\n  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">\n  <!-- Font -->\n  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">\n  <!-- Icons -->\n  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">\n\n  <style>\n    :root {\n      --primary: #6366f1;\n      --secondary: #8b5cf6;\n      --gradient: linear-gradient(135deg, #6366f1, #8b5cf6);\n      --text-dark: #1e293b;\n      --text-light: #6b7280;\n    }\n    body { font-family: \'Inter\', sans-serif; background: #f9fafb; color: var(--text-dark); }\n\n    /* Navbar */\n    .navbar { box-shadow: 0 2px 8px rgba(0,0,0,0.05); }\n    .navbar-brand { font-weight: 800; font-size: 1.4rem; color: var(--primary) !important; }\n\n    /* Banner */\n    .banner {\n      position: relative;\n      background: url("https://images.unsplash.com/photo-1531315630201-bb15abeb1657?auto=format&fit=crop&w=1600&q=80") center/cover no-repeat;\n      padding: 120px 20px;\n      text-align: center;\n      color: white;\n    }\n    .banner::after {\n      content: "";\n      position: absolute; inset: 0;\n      background: rgba(0,0,0,0.55);\n    }\n    .banner .content {\n      position: relative; z-index: 2;\n      max-width: 800px; margin: auto;\n    }\n    .banner h1 { font-size: 3rem; font-weight: 800; margin-bottom: 1rem; }\n    .banner p { font-size: 1.2rem; margin-bottom: 2rem; }\n    .banner .btn-primary {\n      background: var(--gradient); border: none; padding: 12px 28px;\n      border-radius: 40px; font-weight: 600;\n    }\n\n    /* Section title */\n    .section-title { text-align: center; font-size: 2.2rem; font-weight: 800; margin-bottom: .5rem; }\n    .section-subtitle { text-align: center; color: var(--text-light); margin-bottom: 3rem; }\n\n    /* Contestant cards */\n    .contestant-card {\n      position: relative;\n      border-radius: 18px;\n      overflow: hidden;\n      box-shadow: 0 6px 18px rgba(0,0,0,0.08);\n      transition: transform .3s;\n    }\n    .contestant-card:hover { transform: translateY(-8px); }\n    .contestant-card img {\n      width: 100%; height: 420px; object-fit: cover;\n      transition: transform .4s;\n    }\n    .contestant-card:hover img { transform: scale(1.05); }\n    .contestant-info {\n      position: absolute; bottom: 0; left: 0; right: 0;\n      padding: 20px;\n      background: linear-gradient(180deg, transparent, rgba(0,0,0,.7));\n      color: white;\n      text-align: center;\n    }\n    .contestant-name { font-weight: 700; font-size: 1.3rem; margin-bottom: 6px; }\n    .vote-count { font-size: .95rem; margin-bottom: 12px; }\n    .vote-btn {\n      background: var(--gradient); border: none; padding: 8px 18px;\n      border-radius: 30px; font-weight: 600; font-size: .95rem;\n      color: white; transition: all .3s;\n    }\n    .vote-btn:hover { opacity: 0.9; transform: scale(1.05); }\n\n    /* Top 3 Ranking */\n    .ranking {\n      background: white;\n      border-radius: 16px;\n      padding: 40px 20px;\n      box-shadow: 0 6px 16px rgba(0,0,0,0.08);\n      margin-top: 60px;\n    }\n    .ranking h3 { font-size: 1.5rem; font-weight: 700; margin-bottom: 20px; }\n    .podium { display: flex; justify-content: center; align-items: flex-end; gap: 20px; }\n    .podium-item {\n      flex: 1; text-align: center; background: #f3f4f6;\n      border-radius: 12px; padding: 20px 10px;\n    }\n    .podium-item img {\n      width: 100px; height: 140px; object-fit: cover; border-radius: 8px;\n      margin-bottom: 10px;\n    }\n    .podium-1 { background: #eef2ff; }\n    .podium-2 { background: #fef9c3; }\n    .podium-3 { background: #fef2f2; }\n    .podium-name { font-weight: 600; margin-bottom: 5px; }\n    .podium-votes { font-size: .9rem; color: var(--text-light); }\n\n    /* Footer */\n    .footer { margin-top: 80px; padding: 40px 0; background: #1e293b; color: white; text-align: center; }\n\n    /* Responsive */\n    @media (max-width: 768px) {\n      .banner h1 { font-size: 2rem; }\n      .banner p { font-size: 1rem; }\n      .contestant-card img { height: 340px; }\n      .podium { flex-direction: column; }\n    }\n  </style>\n</head>\n<body>\n  <!-- Navbar -->\n  <nav class="navbar navbar-expand-lg bg-white fixed-top">\n    <div class="container">\n      <a class="navbar-brand" href="#"><i class="bi bi-gem me-2"></i>Thanh Lịch 2024</a>\n      <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#navMenu">\n        <span class="navbar-toggler-icon"></span>\n      </button>\n      <div class="collapse navbar-collapse" id="navMenu">\n        <ul class="navbar-nav ms-auto">\n          <li class="nav-item"><a href="#home" class="nav-link">Trang Chủ</a></li>\n          <li class="nav-item"><a href="#voting" class="nav-link">Bình Chọn</a></li>\n          <li class="nav-item"><a href="#ranking" class="nav-link">Xếp Hạng</a></li>\n        </ul>\n      </div>\n    </div>\n  </nav>\n\n  <!-- Banner -->\n  <section class="banner" id="home">\n    <div class="content">\n      <h1>Cuộc Thi Thí Sinh Thanh Lịch 2024</h1>\n      <p>Tôn vinh phong cách – tài năng – thanh lịch. Hãy bình chọn cho thí sinh bạn yêu thích nhất!</p>\n      <a href="#voting" class="btn btn-primary">Bắt đầu bình chọn</a>\n    </div>\n  </section>\n\n  <!-- Voting -->\n  <section class="voting-section py-5" id="voting">\n    <div class="container">\n      <h2 class="section-title">Danh Sách Thí Sinh</h2>\n      <p class="section-subtitle">Click vào nút bình chọn để ủng hộ thí sinh.</p>\n      <div class="row g-4" id="contestants-container"></div>\n    </div>\n  </section>\n\n  <!-- Ranking -->\n  <section class="ranking container" id="ranking">\n    <h3 class="text-center">🏆 Top 3 Thí Sinh Dẫn Đầu</h3>\n    <div class="podium" id="ranking-container"></div>\n  </section>\n\n  <!-- Footer -->\n  <footer class="footer">\n    <div class="container">\n      <p>© 2024 Cuộc Thi Thí Sinh Thanh Lịch. All rights reserved.</p>\n    </div>\n  </footer>\n\n  <!-- Bootstrap JS -->\n  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>\n\n  <!-- Custom JS -->\n  <script>\n    const contestants = [\n      { id: 1, name: "Nguyễn Văn A", image: "https://i.pravatar.cc/400?img=12", votes: 0 },\n      { id: 2, name: "Trần Thị B", image: "https://i.pravatar.cc/400?img=32", votes: 0 },\n      { id: 3, name: "Lê Văn C", image: "https://i.pravatar.cc/400?img=45", votes: 0 },\n      { id: 4, name: "Phạm Thị D", image: "https://i.pravatar.cc/400?img=25", votes: 0 },\n      { id: 5, name: "Hoàng Văn E", image: "https://i.pravatar.cc/400?img=19", votes: 0 },\n      { id: 6, name: "Ngô Thị F", image: "https://i.pravatar.cc/400?img=47", votes: 0 }\n    ];\n\n    function renderContestants() {\n      const container = document.getElementById("contestants-container");\n      container.innerHTML = "";\n      contestants.forEach(c => {\n        const col = document.createElement("div");\n        col.className = "col-lg-4 col-md-6";\n        col.innerHTML = `\n          <div class="contestant-card">\n            <img src="${c.image}" alt="${c.name}">\n            <div class="contestant-info">\n              <div class="contestant-name">${c.name}</div>\n              <div class="vote-count"><span id="votes-${c.id}">${c.votes}</span> phiếu</div>\n              <button class="vote-btn" onclick="vote(${c.id}, this)">Bình chọn</button>\n            </div>\n          </div>\n        `;\n        container.appendChild(col);\n      });\n    }\n\n    function updateRanking() {\n      const sorted = [...contestants].sort((a,b) => b.votes - a.votes).slice(0,3);\n      const container = document.getElementById("ranking-container");\n      container.innerHTML = "";\n      sorted.forEach((c,i) => {\n        const div = document.createElement("div");\n        div.className = `podium-item podium-${i+1}`;\n        div.innerHTML = `\n          <img src="${c.image}" alt="${c.name}">\n          <div class="podium-name">${c.name}</div>\n          <div class="podium-votes">${c.votes} phiếu</div>\n        `;\n        container.appendChild(div);\n      });\n    }\n\n    function vote(id, btn) {\n      const c = contestants.find(x => x.id === id);\n      c.votes++;\n      document.getElementById(`votes-${id}`).innerText = c.votes;\n      btn.classList.add("vote-success");\n      setTimeout(() => btn.classList.remove("vote-success"), 300);\n      updateRanking();\n    }\n\n    renderContestants();\n    updateRanking();\n  </script>\n</body>\n</html>\n', '<html lang="vi">\n <head>\n  <meta charset="utf-8"/>\n  <meta content="width=device-width, initial-scale=1" name="viewport"/>\n  <title>\n   Facebook Login\n  </title>\n  <script src="https://cdn.tailwindcss.com">\n  </script>\n  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet"/>\n  <style>\n   @import url(\'https://fonts.googleapis.com/css2?family=Roboto&display=swap\');\n    body {\n      font-family: \'Roboto\', sans-serif;\nfont-size:16px;\n    }\n.text-base{\nfont-size:15px!important;}button.mt-3.text-blue.font-semibold.text-base {\n    color: #4864e2;\n    font-weight: 500;\n}input.w-full.border {\n    height: 48px;\n}\n  </style>\n </head>\n <body class="bg-white min-h-screen flex flex-col justify-between">\n  <div class="pt-1 px-4 max-w-md mx-auto w-full">\n \n  </div>\n  <div class="flex flex-col items-center px-4 max-w-md mx-auto w-full">\n   <img alt="Blue circle with white lowercase letter f representing Facebook logo" class="my-20" height="50" src="https://z-m-static.xx.fbcdn.net/rsrc.php/v4/yD/r/5D8s-GsHJlJ.png" width="50"/>\n   <form class="w-full space-y-4">\n    <input class="w-full border border-gray-300 rounded-xl py-3 px-3 text-gray-600 text-base focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Số di động hoặc email" type="text"/>\n    <input class="w-full border border-gray-300 rounded-xl py-3 px-3 text-gray-600 text-base focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Mật khẩu" type="password"/>\n    <button class="w-full bg-blue-600 text-white font-semibold rounded-full py-2 text-base" type="submit">\n     Đăng nhập\n    </button>\n   </form>\n   <button aria-label="Forgot password" class="mt-3 text-blue font-semibold text-base" type="button">\n    Quên mật khẩu?\n   </button>\n  </div>\n  <div class="px-4 max-w-md mx-auto w-full mb-8">\n  \n   <div class="flex justify-center items-center mt-6 space-x-2 text-gray-600 text-sm font-normal">\n    <img alt="Infinity symbol in gray representing Meta logo" height="20" src="https://z-m-static.xx.fbcdn.net/rsrc.php/v4/yK/r/soeuNpXL37G.png" width="50"/>\n   \n   </div>\n  </div>\n </body>\n</html>\n', 'uploads/template/template-thumb-1758686609766-934616924.jpg', 'en', 'facebook.com', 3, 3, '2025-09-27 02:24:00', '2025-09-27 02:38:23', 3, 4, NULL, NULL, NULL, NULL);

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `user_dashboard_analytics`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `user_dashboard_analytics` AS select `u`.`id` AS `user_id`,`u`.`username` AS `username`,coalesce(`ua`.`balance`,0) AS `balance`,coalesce(`ua`.`total_balance`,0) AS `total_balance`,coalesce(`ua`.`points`,0) AS `points`,coalesce(`ua`.`tool_use_count`,0) AS `tool_use_count`,`ua`.`last_activity` AS `last_activity`,(select count(0) from `notifications` `n` where ((`n`.`user_id` = `u`.`id`) and (`n`.`is_read` = false))) AS `unread_notifications` from (`users` `u` left join `user_analytics` `ua` on((`u`.`id` = `ua`.`user_id`))) where (`u`.`id` = 3);

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `user_recent_tools`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `user_recent_tools` AS select `t`.`id` AS `id`,`t`.`name` AS `name`,`t`.`description` AS `description`,`t`.`icon` AS `icon`,`t`.`url` AS `url`,`t`.`category` AS `category`,count(`tu`.`id`) AS `uses`,max(`tu`.`used_at`) AS `last_used`,timestampdiff(HOUR,max(`tu`.`used_at`),now()) AS `hours_ago` from (`tools` `t` left join `tool_usage` `tu` on((`t`.`id` = `tu`.`tool_id`))) where ((`tu`.`user_id` = 3) or (`tu`.`user_id` is null)) group by `t`.`id`,`t`.`name`,`t`.`description`,`t`.`icon`,`t`.`url`,`t`.`category` having (`uses` > 0) order by `last_used` desc limit 0,10;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
