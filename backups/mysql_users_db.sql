-- MySQL dump 10.13  Distrib 8.4.7, for Linux (x86_64)
--
-- Host: localhost    Database: users_db
-- ------------------------------------------------------
-- Server version	8.4.7

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `users_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `users_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `users_db`;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `role` enum('ADMIN','TEAM_LEADER','MEMBER') DEFAULT NULL,
  `active` tinyint(1) DEFAULT NULL,
  `avatar_filename` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`username`),
  UNIQUE KEY `ix_users_email` (`email`),
  KEY `ix_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('admin','admin@tucnerfifflin.com','$2b$12$9S0mPmbr1KKP6pdN4ODcYe/bl7FDjbdWgFNjDjpjHJYx3Jub3TCDG','Admin','Adminoglou','ADMIN',1,NULL),('amartin','amartin@tucnerfifflin.com','$2b$12$23blDn3j83cjlCerO2j6Zu77lBb8rfN3ROgWKFCqBq36etUlLhOB6','Angela','Martin','TEAM_LEADER',1,'amartin_avatar.jpg'),('dschrute','dschrute@tucnerfifflin.com','$2b$12$28JCrVam0fn9XEDaldv5meTP9gLbJBZ0wxo1ZdIum/CEy1Hp56HM.','Dwight','Schrute','TEAM_LEADER',1,'dschrute_avatar.jpg'),('jhalpert','jhalpert@tucnerfifflin.com','$2b$12$KIecHreMj2YClOlKiq7UQ.Tb03GfW75JWta1eFwlWU04los.HJgBq','Jim','Halpert','MEMBER',1,'jhalpert_avatar.jpg'),('jlevinson','jlevinson@tucnerfifflin.com','$2b$12$HTlmvrigVNc8qfYahg5GwOiH4Mhx7TdVUxi.ayzetgdwJLMD2XR8i','Janet','Levinson','MEMBER',1,'jlevinson_avatar.jpg'),('mpalmer','mpalmer@tucnerfifflin.com','$2b$12$8SoyAD3QJ6U6VrkD4NYcNeoMyzTGEcjrP72u3nbeCPTYo4.YKmlry','Meredith','Palmer','MEMBER',1,'mpalmer_avatar.jpg'),('mscott','mscott@tucnerfifflin.com','$2b$12$yWLbZ4JHl60verRLn423ou1NT/Rds.RoeW.vVfxQNKtnAvx2DtP5.','Michael','Scott','TEAM_LEADER',1,'mscott_avatar.jpg'),('omartinez','omartinez@tucnerfifflin.com','$2b$12$7NODeBMf0MsrM5EkLWs1t.yWmArJnjPuhepI6QWv5yQsrBGj/aDIi','Oscar','Martinez','TEAM_LEADER',1,'omartinez_avatar.jpg'),('pbeasly','pbeasly@tucnerfifflin.com','$2b$12$NY70GAX2Dj4py1YCDhEW.OB7DbvJeYt0u0IWiUW.5jES79fzAheEq','Pamela','Beasly','TEAM_LEADER',1,'pbeasly_avatar.jpg'),('tflenderson','tflenderson@tucnerfifflin.com','$2b$12$hZTyfKFOmoCKTmYTChCpY.BNFgY9PihlUizweIem7oVkXZw7gem.K','Tobias','Flenderson','MEMBER',1,'tflenderson_avatar.jpg');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-20 17:34:35
