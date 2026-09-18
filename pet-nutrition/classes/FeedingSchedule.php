<?php
class FeedingSchedule {
    private int $mealsPerDay;
    private string $firstMealTime;

    public function __construct(int $mealsPerDay = 2, string $firstMealTime = '08:00') {
        $this->mealsPerDay = $mealsPerDay;
        $this->firstMealTime = $firstMealTime;
    }

    public function calculatePortionPerMeal(float $dailyGrams): float {
        return $this->mealsPerDay > 0 ? ($dailyGrams / $this->mealsPerDay) : 0;
    }

    public function getMealSlots(float $dailyGrams): array {
        $portion = $this->calculatePortionPerMeal($dailyGrams);
        $slots = [];
        list($hours, $minutes) = explode(':', $this->firstMealTime);
        $intervalHours = floor(12 / max(1, $this->mealsPerDay - 1));

        for ($i = 0; $i < $this->mealsPerDay; $i++) {
            $currentH = ($hours + ($i * $intervalHours)) % 24;
            $timeStr = sprintf("%02d:%02d น.", $currentH, $minutes);
            $slots[] = [
                'time' => $timeStr,
                'portion' => round($portion, 1)
            ];
        }
        return $slots;
    }
}