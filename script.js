let W, vocab;
(async()=>{
  [W,vocab] = await Promise.all([
    fetch('weights.json').then(r=>r.json()),
    fetch('vocab.json').then(r=>r.json())
  ]);
})();

const STOPWORDS = {/* ... same list as before ... */};
const mealSettings = ['Week day lunch','Week day dinner','Weekend lunch','Weekend dinner','At a party','Late night snack'];
const relationships = ['Parents','Siblings','Friends','Strangers','Teachers'];
const spiceMap = {
  'None':0,
  'A little (mild)':1,
  'A moderate amount (medium)':2,
  'A lot (hot)':3,
  'I will have some of this food item with my hot sauce':4
};
const labels = ['Pizza','Shawarma','Sushi'];

function cleanText(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g,'')
    .split(/\s+/)
    .filter(w=> !/^\d+$/.test(w) && !(w in STOPWORDS))
    .join(' ');
}

function countIngredients(text) {
  const nums = [...text.matchAll(/\d+/g)].map(m=>+m[0]);
  if(nums.length) return Math.max(...nums);
  return text.split(',').length;
}

function extractPrice(text) {
  const nums = [...text.matchAll(/\d*\.?\d+/g)].map(m=>+m[0]);
  return nums.length? Math.min(...nums): 3.0;
}

function vectorize() {
  const complexity = +document.getElementById('complexity').value;
  const ingrCount = countIngredients(document.getElementById('ingredients-text').value);
  const meal = mealSettings.map(s=> document.querySelector(`input[name=meal][value="${s}"]`).checked ? 1 : 0);
  const price = extractPrice(document.getElementById('price').value);
  const rel = relationships.map(r=> document.querySelector(`input[name=rel][value="${r}"]`).checked ? 1 : 0);
  const spice = spiceMap[document.getElementById('spice').value]||0;

  const text = ['ingredients-text','movie','drink']
    .map(id=> cleanText(document.getElementById(id).value))
    .join(' ');

  const bow = new Array(Object.keys(vocab).length).fill(0);
  text.split(' ').forEach(w=> { if(w in vocab) bow[vocab[w]]++; });

  const nums = [complexity, ingrCount, ...meal, price, ...rel, spice];
  return [1, ...nums, ...bow];
}

function softmax(logits) {
  const m = Math.max(...logits);
  const ex = logits.map(x=>Math.exp(x-m));
  const sum = ex.reduce((a,b)=>a+b,0);
  return ex.map(x=>x/sum);
}

document.getElementById('predict-form')
  .addEventListener('submit', e=>{
    e.preventDefault();
    const vec = vectorize();
    const logits = labels.map((_,i)=> vec.reduce((s,v,j)=> s + v*W[j][i], 0));
    const probs = softmax(logits);
    const idx = probs.indexOf(Math.max(...probs));
    document.getElementById('result').textContent = `Prediction: ${labels[idx]} (${(probs[idx]*100).toFixed(1)}%)`;
  });