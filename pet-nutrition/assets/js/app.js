// ==========================================
// GLOBAL STATES
// ==========================================
let currentSpecies = 'dog';
let currentEditingPetId = null;

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  runCalc();
});

// ==========================================
// 1. MODAL CONTROLLER
// ==========================================
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'flex';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

window.onclick = function(event) {
  if (event.target.classList.contains('modal-overlay')) {
    event.target.style.display = 'none';
  }
};

// ==========================================
// 2. AUTHENTICATION MANAGEMENT
// ==========================================
async function checkSession() {
  try {
    const res = await fetch('api.php?action=check_session');
    const data = await res.json();
    
    const guestTools = document.getElementById('guest-tools');
    const userTools = document.getElementById('user-tools');
    const userDisplayName = document.getElementById('user-display-name');

    if (data.logged_in) {
      if (guestTools) guestTools.style.display = 'none';
      if (userTools) userTools.style.display = 'flex';
      if (userDisplayName) userDisplayName.textContent = `คุณ ${data.user_name}`;
    } else {
      if (guestTools) guestTools.style.display = 'flex';
      if (userTools) userTools.style.display = 'none';
    }
  } catch (error) {
    console.error('Error checking session:', error);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const formData = new FormData();
  formData.append('email', document.getElementById('login-email').value);
  formData.append('password', document.getElementById('login-password').value);

  try {
    const res = await fetch('api.php?action=login', { method: 'POST', body: formData });
    const data = await res.json();
    
    if (data.success) {
      closeModal('login-modal');
      checkSession();
      alert('เข้าสู่ระบบสำเร็จ!');
    } else {
      alert(data.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  } catch (error) {
    alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const formData = new FormData();
  formData.append('fullname', document.getElementById('reg-name').value);
  formData.append('email', document.getElementById('reg-email').value);
  formData.append('password', document.getElementById('reg-password').value);

  try {
    const res = await fetch('api.php?action=register', { method: 'POST', body: formData });
    const data = await res.json();
    
    if (data.success) {
      closeModal('register-modal');
      checkSession();
      alert('สมัครสมาชิกสำเร็จ!');
    } else {
      alert(data.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    }
  } catch (error) {
    alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
  }
}

async function logout() {
  await fetch('api.php?action=logout');
  checkSession();
  currentEditingPetId = null;
  alert('ออกจากระบบเรียบร้อยแล้ว');
}

// ==========================================
// 3. PET CRUD MANAGEMENT
// ==========================================
function resetPetForm() {
  currentEditingPetId = null; // รีเซ็ตเพื่อ INSERT ตัวใหม่
  document.getElementById('pet-name').value = 'น้องใหม่';
  document.getElementById('pet-weight').value = '5.0';
  document.getElementById('is-neutered').checked = false;
  alert('ล้างข้อมูลเรียบร้อย! กรุณากรอกข้อมูลสัตว์เลี้ยงตัวใหม่แล้วกดบันทึกได้เลยครับ');
  runCalc();
}

async function savePetData() {
  const name = document.getElementById('pet-name').value;
  const weight = document.getElementById('pet-weight').value;
  const ageStage = document.querySelector('input[name="age-stage"]:checked')?.value || 'adult';
  const activityLevel = document.querySelector('input[name="activity-level"]:checked')?.value || 'normal';
  const isNeutered = document.getElementById('is-neutered')?.checked ? 1 : 0;
  const breedSize = document.getElementById('breed-size')?.value || 'medium';
  const foodType = document.querySelector('input[name="food-type"]:checked')?.value || 'wet';
  const foodCal = document.getElementById('food-cal').value;
  const mealsCount = document.querySelector('input[name="meals-count"]:checked')?.value || '2';
  const startTime = document.getElementById('start-time').value;

  const formData = new FormData();
  if (currentEditingPetId) {
    formData.append('pet_id', currentEditingPetId);
  }
  formData.append('name', name);
  formData.append('species', currentSpecies);
  formData.append('weight', weight);
  formData.append('age_stage', ageStage);
  formData.append('activity_level', activityLevel);
  formData.append('is_neutered', isNeutered);
  formData.append('breed_size', breedSize);
  formData.append('food_type', foodType);
  formData.append('calories_per_100g', foodCal);
  formData.append('meals_per_day', mealsCount);
  formData.append('first_meal_time', startTime);

  try {
    const res = await fetch('api.php?action=save_pet', { method: 'POST', body: formData });
    const data = await res.json();

    if (data.success) {
      alert(currentEditingPetId ? 'อัปเดตข้อมูลเรียบร้อย!' : 'บันทึกสัตว์เลี้ยงใหม่เรียบร้อย!');
      currentEditingPetId = null;
    } else {
      alert(data.message || 'กรุณาล็อกอินก่อนใช้งาน');
      if (!data.logged_in) openModal('login-modal');
    }
  } catch (error) {
    alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
  }
}

async function openMyPetsModal() {
  try {
    const res = await fetch('api.php?action=get_pets');
    const data = await res.json();
    const container = document.getElementById('pets-list-container');
    container.innerHTML = '';

    if (!data.success || !data.pets || data.pets.length === 0) {
      container.innerHTML = '<p style="text-align:center; padding:20px; color:#64748b;">ยังไม่มีข้อมูลสัตว์เลี้ยงที่บันทึกไว้</p>';
    } else {
      data.pets.forEach(pet => {
        const icon = pet.species === 'dog' ? '🐶' : '🐱';
        const speciesText = pet.species === 'dog' ? 'สุนัข' : 'แมว';
        
        const cardHtml = `
          <div class="pet-item-card">
            <div style="font-weight: bold; color: var(--primary-pink-dark);">
              ${icon} ${pet.name} (${pet.weight} kg) - <span style="font-size:0.8rem; color:#64748b;">${speciesText}</span>
            </div>
            <div style="font-size: 0.8rem; color: #475569; margin-top: 4px;">
              ช่วงวัย: ${pet.age_stage} | อาหาร: ${pet.food_type} (${pet.calories_per_100g} kcal/100g) | ${pet.meals_per_day} มื้อ/วัน
            </div>
            <div class="pet-card-actions">
              <button type="button" onclick='loadPetToForm(${JSON.stringify(pet)})'>📝 โหลด/แก้ไข</button>
              <button type="button" onclick='deletePet(${pet.id})' class="btn-del">🗑️ ลบ</button>
            </div>
          </div>
        `;
        container.innerHTML += cardHtml;
      });
    }
    openModal('mypets-modal');
  } catch (error) {
    alert('ไม่สามารถโหลดรายการสัตว์เลี้ยงได้');
  }
}

function loadPetToForm(pet) {
  currentEditingPetId = pet.id;
  
  setSpecies(pet.species);
  document.getElementById('pet-name').value = pet.name;
  document.getElementById('pet-weight').value = pet.weight;
  
  const ageRadio = document.querySelector(`input[name="age-stage"][value="${pet.age_stage}"]`);
  if (ageRadio) ageRadio.checked = true;

  const actRadio = document.querySelector(`input[name="activity-level"][value="${pet.activity_level}"]`);
  if (actRadio) actRadio.checked = true;

  if (document.getElementById('is-neutered')) {
    document.getElementById('is-neutered').checked = (parseInt(pet.is_neutered) === 1);
  }

  if (document.getElementById('breed-size') && pet.breed_size) {
    document.getElementById('breed-size').value = pet.breed_size;
  }

  const foodRadio = document.querySelector(`input[name="food-type"][value="${pet.food_type}"]`);
  if (foodRadio) foodRadio.checked = true;

  document.getElementById('food-cal').value = pet.calories_per_100g;

  const mealsRadio = document.querySelector(`input[name="meals-count"][value="${pet.meals_per_day}"]`);
  if (mealsRadio) mealsRadio.checked = true;

  document.getElementById('start-time').value = pet.first_meal_time;

  closeModal('mypets-modal');
  runCalc();
}

async function deletePet(id) {
  if (!confirm('คุณต้องการลบข้อมูลสัตว์เลี้ยงนี้ใช่หรือไม่?')) return;

  const formData = new FormData();
  formData.append('pet_id', id);

  try {
    const res = await fetch('api.php?action=delete_pet', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      if (currentEditingPetId === id) currentEditingPetId = null;
      openMyPetsModal();
    } else {
      alert(data.message || 'ลบข้อมูลไม่สำเร็จ');
    }
  } catch (error) {
    alert('เกิดข้อผิดพลาดในการลบ');
  }
}

// ==========================================
// 4. CALCULATION & UI LOGIC (OOP CALCULATOR)
// ==========================================
function setSpecies(species) {
  currentSpecies = species;
  const tabDog = document.getElementById('tab-dog');
  const tabCat = document.getElementById('tab-cat');

  if (species === 'dog') {
    tabDog.classList.add('active');
    tabCat.classList.remove('active');
  } else {
    tabCat.classList.add('active');
    tabDog.classList.remove('active');
  }
  runCalc();
}

function stepWeight(delta) {
  const input = document.getElementById('pet-weight');
  let val = parseFloat(input.value) || 0;
  val = Math.max(0.1, val + delta);
  input.value = val.toFixed(1);
  runCalc();
}

function setKcal(val) {
  document.getElementById('food-cal').value = val;
  runCalc();
}

function runCalc() {
  const name = document.getElementById('pet-name')?.value || 'น้อง';
  const weight = parseFloat(document.getElementById('pet-weight')?.value) || 1.0;
  const ageStage = document.querySelector('input[name="age-stage"]:checked')?.value || 'adult';
  const activityLevel = document.querySelector('input[name="activity-level"]:checked')?.value || 'normal';
  const isNeutered = document.getElementById('is-neutered')?.checked || false;
  
  const foodCal = parseFloat(document.getElementById('food-cal')?.value) || 85;
  const mealsCount = parseInt(document.querySelector('input[name="meals-count"]:checked')?.value || '2', 10);
  const startTime = document.getElementById('start-time')?.value || '08:00';

  // 1. คำนวณ RER = 70 * (weight ^ 0.75)
  const rer = 70 * Math.pow(weight, 0.75);

  // 2. คำนวณ DER Multiplier ตามเงื่อนไข สัตว์เลี้ยง/ทำหมัน/กิจกรรม
  let factor = 1.6;
  if (currentSpecies === 'dog') {
    if (ageStage === 'pup') factor = 2.0;
    else if (ageStage === 'senior') factor = 1.2;
    else {
      if (activityLevel === 'low') factor = 1.2;
      else if (activityLevel === 'high') factor = 2.0;
      else factor = isNeutered ? 1.6 : 1.8;
    }
  } else { // cat
    if (ageStage === 'pup') factor = 2.5;
    else if (ageStage === 'senior') factor = 1.0;
    else {
      if (activityLevel === 'low') factor = 1.0;
      else if (activityLevel === 'high') factor = 1.6;
      else factor = isNeutered ? 1.2 : 1.4;
    }
  }

  const der = rer * factor;
  const dailyGrams = (der / foodCal) * 100;
  const mealGrams = dailyGrams / mealsCount;

  // Render ข้อมูลลง Dashboard
  if (document.getElementById('badge-pet-info')) document.getElementById('badge-pet-info').textContent = `${name} (${weight.toFixed(1)} kg)`;
  if (document.getElementById('res-daily-grams')) document.getElementById('res-daily-grams').textContent = Math.round(dailyGrams).toLocaleString();
  if (document.getElementById('res-meal-grams')) document.getElementById('res-meal-grams').textContent = (Math.round(mealGrams * 10) / 10).toFixed(1);
  if (document.getElementById('res-meal-sub')) document.getElementById('res-meal-sub').textContent = `กรัม / มื้อ (${mealsCount} มื้อ/วัน)`;
  
  if (document.getElementById('res-rer')) document.getElementById('res-rer').textContent = Math.round(rer);
  if (document.getElementById('res-factor')) document.getElementById('res-factor').textContent = `${factor.toFixed(1)}x`;
  if (document.getElementById('res-der')) document.getElementById('res-der').textContent = Math.round(der);

  if (document.getElementById('res-water-name')) document.getElementById('res-water-name').textContent = name;
  if (document.getElementById('res-water-val')) document.getElementById('res-water-val').textContent = Math.round(weight * 55);

  renderTimeline(startTime, mealsCount, mealGrams);
}

function renderTimeline(startTimeStr, mealsCount, mealGrams) {
  const container = document.getElementById('timeline-list');
  if (!container) return;
  container.innerHTML = '';

  let [hours, minutes] = startTimeStr.split(':').map(Number);
  const intervalHours = Math.floor(12 / Math.max(1, mealsCount - 1)) || 4;

  const mealLabels = ['มื้อเช้า', 'มื้อเที่ยง', 'มื้อเย็น', 'มื้อดึก'];

  for (let i = 0; i < mealsCount; i++) {
    let currentH = (hours + (i * intervalHours)) % 24;
    let timeFormatted = `${String(currentH).padStart(2, '0')}:${String(minutes).padStart(2, '0')} น.`;
    let label = mealLabels[i] || `มื้อที่ ${i + 1}`;

    const itemHtml = `
      <div class="timeline-item">
        <div class="timeline-time">${timeFormatted}</div>
        <div class="timeline-label">${label}</div>
        <div class="timeline-value">${(Math.round(mealGrams * 10) / 10).toFixed(1)} กรัม</div>
      </div>
    `;
    container.innerHTML += itemHtml;
  }
}