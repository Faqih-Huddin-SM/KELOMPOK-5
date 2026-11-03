<?php
require_once __DIR__ . '/../config/config.php';

session_unset();
session_destroy();

header('Location: /KELOMPOK-5/pages/login.php');
exit;