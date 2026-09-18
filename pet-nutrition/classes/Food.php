<?php
class Food {
    private string $name;
    private string $foodType;
    private float $caloriesPer100g;

    public function __construct(string $name, string $foodType, float $caloriesPer100g) {
        $this->name = $name;
        $this->foodType = $foodType;
        $this->caloriesPer100g = $caloriesPer100g;
    }

    public function getCaloriesPerGram(): float {
        return $this->caloriesPer100g / 100.0;
    }
}