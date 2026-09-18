<?php
session_start();
header('Content-Type: application/json');
require_once 'config/db.php';

$action = $_GET['action'] ?? '';

// ---- 1. REGISTRATION ----
if ($action === 'register') {
    $fullname = trim($_POST['fullname'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if (!$fullname || !$email || !$password) {
        echo json_encode(['success' => false, 'message' => 'กรุณากรอกข้อมูลให้ครบถ้วน']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'อีเมลนี้ถูกใช้งานแล้ว']);
        exit;
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)");
    $stmt->execute([$fullname, $email, $hashedPassword]);

    $_SESSION['user_id'] = $pdo->lastInsertId();
    $_SESSION['user_name'] = $fullname;

    echo json_encode(['success' => true, 'user' => ['name' => $fullname]]);
    exit;
}

// ---- 2. LOGIN ----
if ($action === 'login') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['fullname'];
        echo json_encode(['success' => true, 'user' => ['name' => $user['fullname']]]);
    } else {
        echo json_encode(['success' => false, 'message' => 'อีเมลหรือรหัสผ่านไม่ถูกต้อง']);
    }
    exit;
}

// ---- 3. LOGOUT ----
if ($action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

// ---- 4. CHECK SESSION ----
if ($action === 'check_session') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode(['logged_in' => true, 'user_name' => $_SESSION['user_name']]);
    } else {
        echo json_encode(['logged_in' => false]);
    }
    exit;
}

// ---- CHECK AUTHENTICATION FOR PET ACTIONS ----
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'กรุณาล็อกอินก่อนใช้งาน']);
    exit;
}

$userId = $_SESSION['user_id'];

// ---- 5. SAVE OR UPDATE PET ----
if ($action === 'save_pet') {
    $petId = $_POST['pet_id'] ?? null;
    $name = $_POST['name'] ?? 'น้อง';
    $species = $_POST['species'] ?? 'dog';
    $weight = floatval($_POST['weight'] ?? 1.0);
    $ageStage = $_POST['age_stage'] ?? 'adult';
    $foodType = $_POST['food_type'] ?? 'wet';
    $calories = intval($_POST['calories_per_100g'] ?? 85);
    $meals = intval($_POST['meals_per_day'] ?? 2);
    $firstMealTime = $_POST['first_meal_time'] ?? '08:00';

    if ($petId) {
        $stmt = $pdo->prepare("UPDATE pets SET name=?, species=?, weight=?, age_stage=?, food_type=?, calories_per_100g=?, meals_per_day=?, first_meal_time=? WHERE id=? AND user_id=?");
        $stmt->execute([$name, $species, $weight, $ageStage, $foodType, $calories, $meals, $firstMealTime, $petId, $userId]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO pets (user_id, name, species, weight, age_stage, food_type, calories_per_100g, meals_per_day, first_meal_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $name, $species, $weight, $ageStage, $foodType, $calories, $meals, $firstMealTime]);
    }

    echo json_encode(['success' => true]);
    exit;
}

// ---- 6. GET PET LIST ----
if ($action === 'get_pets') {
    $stmt = $pdo->prepare("SELECT * FROM pets WHERE user_id = ? ORDER BY updated_at DESC");
    $stmt->execute([$userId]);
    $pets = $stmt->fetchAll();
    echo json_encode(['success' => true, 'pets' => $pets]);
    exit;
}

// ---- 7. DELETE PET ----
if ($action === 'delete_pet') {
    $petId = $_POST['pet_id'] ?? 0;
    $stmt = $pdo->prepare("DELETE FROM pets WHERE id = ? AND user_id = ?");
    $stmt->execute([$petId, $userId]);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'calculate') {
    require_once 'classes/Pet.php';
    require_once 'classes/Food.php';
    require_once 'classes/FeedingCalculator.php';
    require_once 'classes/FeedingSchedule.php';

    $species = $_POST['species'] ?? 'dog';
    $name = $_POST['name'] ?? 'น้อง';
    $weight = floatval($_POST['weight'] ?? 1.0);
    $ageStage = $_POST['age_stage'] ?? 'adult';
    $foodType = $_POST['food_type'] ?? 'wet';
    $calories = floatval($_POST['calories_per_100g'] ?? 85);
    $meals = intval($_POST['meals_per_day'] ?? 2);
    $startTime = $_POST['first_meal_time'] ?? '08:00';

    // 1. สร้าง Instance ตาม Diagram
    $pet = ($species === 'dog') 
        ? new Dog($name, $weight, $ageStage) 
        : new Cat($name, $weight, $ageStage);

    $food = new Food("อาหารทั่วไป", $foodType, $calories);

    // 2. คำนวณด้วย FeedingCalculator
    $calculator = new FeedingCalculator();
    $rer = $calculator->calculateRER($weight);
    $der = $calculator->calculateDER($pet);
    $dailyGrams = $calculator->calculateDailyPortion($pet, $food);

    // 3. จัดมื้ออาหารด้วย FeedingSchedule
    $schedule = new FeedingSchedule($meals, $startTime);
    $mealPortion = $schedule->calculatePortionPerMeal($dailyGrams);
    $slots = $schedule->getMealSlots($dailyGrams);

    echo json_encode([
        'success' => true,
        'rer' => round($rer),
        'der' => round($der),
        'factor' => $pet->getDERMultiplier(),
        'daily_grams' => round($dailyGrams),
        'meal_grams' => round($mealPortion, 1),
        'slots' => $slots
    ]);
    exit;
}
?>