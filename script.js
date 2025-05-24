// Load model weights & vocab
let W, vocab;
(async function(){
  [W, vocab] = await Promise.all([
    fetch('weights.json').then(r=>r.json()),
    fetch('vocab.json').then(r=>r.json())
  ]);
})();

// Mapping & utilities
const spiceMap = {
  'None':0,
  'A little (mild)':1,
  'A moderate amount (medium)':2,
  'A lot (hot)':3,
  'I will have some of this food item with my hot sauce':4
};
const labels = ['Pizza','Shawarma','Sushi'];

function softmax(arr) {
  const m = Math.max(...arr);
  const ex = arr.map(x=>Math.exp(x-m));
  const sum = ex.reduce((a,b)=>a+b,0);
  return ex.map(x=>x/sum);
}

// Simplified vector builder for this wizard
function buildVector(answers) {
  // answers: {food, complexity, ingredients, spice}
  // Dummy full-vector: [1, complexity, ingredients, ... zeros ..., spice]
  const vec = [1, +answers.complexity, +answers.ingredients];
  // pad zeros to match vocab length + other fields
  const padLen = W.length - vec.length - 1;
  return vec.concat(Array(padLen).fill(0), spiceMap[answers.spice] || 0);
}

// Wizard logic
const steps = Array.from(document.querySelectorAll('.step-content'));
const indicators = Array.from(document.querySelectorAll('.step'));
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
let currentStep = 0;
const answers = {};

function showStep(i) {
  steps.forEach((s, idx)=> s.classList.toggle('active', idx===i));
  indicators.forEach((ind, idx)=> ind.classList.toggle('active', idx<=i));
  prevBtn.disabled = i===0;
  nextBtn.textContent = i===steps.length-1 ? 'Restart' : 'Next';
}

// Food selection
document.querySelectorAll('.option-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.option-btn').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');
    answers.food = btn.dataset.value;
  });
});

prevBtn.addEventListener('click', ()=>{
  if(currentStep>0) currentStep--;
  showStep(currentStep);
});

nextBtn.addEventListener('click', ()=>{
  if(currentStep < steps.length-1) {
    // gather answers on each step
    if(currentStep===1) answers.complexity = document.getElementById('complexity').value;
    if(currentStep===2) answers.ingredients = document.getElementById('ingredients-text').value;
    if(currentStep===3) answers.spice = document.getElementById('spice').value;
    currentStep++;
    if(currentStep===steps.length-1) {
      // final prediction
      const vec = buildVector(answers);
      const logits = labels.map((_,i)=> vec.reduce((s,v,j)=> s + v * W[j][i], 0));
      const probs = softmax(logits);
      const idx = probs.indexOf(Math.max(...probs));
      document.getElementById('result-text').textContent = `Prediction: ${labels[idx]} (${(probs[idx]*100).toFixed(1)}%)`;
    }
  } else {
    // restart
    location.reload();
  }
  showStep(currentStep);
});

// Initialize
showStep(0);