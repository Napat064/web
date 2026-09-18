<?php
abstract class Pet {
    protected string $name;
    protected float $weight;
    protected string $ageStage;
    protected bool $isNeutered;

    public function __construct(string $name, float $weight, string $ageStage = 'adult', bool $isNeutered = false) {
        $this->name = $name;
        $this->weight = $weight;
        $this->ageStage = $ageStage;
        $this->isNeutered = $isNeutered;
    }

    public function getWeight(): float { return $this->weight; }
    public function getName(): string { return $this->name; }
    
    abstract public function getDERMultiplier(): float;
}

class Dog extends Pet {
    private string $breedSize;

    public function __construct(string $name, float $weight, string $ageStage = 'adult', bool $isNeutered = false, string $breedSize = 'medium') {
        parent::__construct($name, $weight, $ageStage, $isNeutered);
        $this->breedSize = $breedSize;
    }

    public function getDERMultiplier(): float {
        if ($this->ageStage === 'pup') return 2.0;
        if ($this->ageStage === 'senior') return 1.2;
        return 1.6;
    }
}

class Cat extends Pet {
    private string $livingHabit;

    public function __construct(string $name, float $weight, string $ageStage = 'adult', bool $isNeutered = false, string $livingHabit = 'indoor') {
        parent::__construct($name, $weight, $ageStage, $isNeutered);
        $this->livingHabit = $livingHabit;
    }

    public function getDERMultiplier(): float {
        if ($this->ageStage === 'pup') return 2.5;
        if ($this->ageStage === 'senior') return 1.0;
        return 1.2;
    }
}