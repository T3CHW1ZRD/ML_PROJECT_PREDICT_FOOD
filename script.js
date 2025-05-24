
document.getElementById('predict-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const W = await fetch('weights.json').then(res => res.json());
  const vocab = await fetch('vocab.json').then(res => res.json());

  const STOPWORDS = {
    "all":1,"also":1,"any":1,"anything":1,"anywhere":1,"are":1,"back":1,"be":1,"because":1,"being":1,"but":1,
    "can":1,"cant":1,"could":1,"down":1,"drink":1,"eg":1,"etc":1,"expect":1,"first":1,"five":1,"food":1,"four":1,
    "get":1,"go":1,"had":1,"has":1,"have":1,"her":1,"here":1,"him":1,"his":1,"how":1,"however":1,"ie":1,"if":1,
    "into":1,"its":1,"just":1,"least":1,"made":1,"many":1,"maybe":1,"me":1,"might":1,"most":1,"mostly":1,"must":1,
    "my":1,"namely":1,"need":1,"no":1,"none":1,"off":1,"often":1,"on":1,"once":1,"or":1,"other":1,"others":1,"our":1,
    "out":1,"over":1,"own":1,"pair":1,"part":1,"people":1,"perhaps":1,"probably":1,"quite":1,"rather":1,"really":1,
    "said":1,"same":1,"say":1,"see":1,"seem":1,"seemed":1,"seeming":1,"seems":1,"several":1,"she":1,"should":1,
    "some":1,"something":1,"still":1,"such":1,"take":1,"than":1,"their":1,"them":1,"then":1,"there":1,"therefore":1,
    "these":1,"they":1,"through":1,"too":1,"under":1,"up":1,"very":1,"was":1,"water":1,"way":1,"we":1,"well":1,"were":1,
    "which":1,"while":1,"whom":1,"whose":1,"why":1,"will":1,"with":1,"without":1,"would":1,"you":1
  };

  function cleanText(s) {
    return s.toLowerCase().replace(/[^\w\s]/g,'').split(/\s+/)
      .filter(w => !/^[0-9]+$/.test(w) && !(w in STOPWORDS));
  }

  function countIngredients(text) {
    let nums = [...text.matchAll(/\d+/g)].map(m=>+m[0]);
    return nums.length ? Math.max(...nums) : text.split(',').length;
  }

  function extractPrice(text) {
    let nums = [...text.matchAll(/\d*\.?\d+/g)].map(m=>+m[0]);
    return nums.length ? Math.min(...nums) : 3.0;
  }

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

  let complexity = +document.getElementById('complexity').value;
  let ingrText = document.getElementById('ingredients-text').value;
  let price = extractPrice(document.getElementById('price').value);
  let movie = document.getElementById('movie').value;
  let drink = document.getElementById('drink').value;
  let spice = spiceMap[document.getElementById('spice').value] || 0;

  let meals = mealSettings.map(m =>
    Array.from(document.querySelectorAll("input[name='meal']:checked")).some(el => el.value === m) ? 1 : 0
  );
  let rels = relationships.map(r =>
    Array.from(document.querySelectorAll("input[name='rel']:checked")).some(el => el.value === r) ? 1 : 0
  );

  let nums = [complexity, countIngredients(ingrText), ...meals, price, ...rels, spice];
  let text = cleanText(ingrText + ' ' + movie + ' ' + drink);

  let bow = new Array(Object.keys(vocab).length).fill(0);
  text.forEach(w => {
    if (w in vocab) bow[vocab[w]]++;
  });

  let vec = [1, ...nums, ...bow];

  function softmax(arr) {
    let m = Math.max(...arr), ex=arr.map(x=>Math.exp(x-m));
    let s = ex.reduce((a,b)=>a+b,0);
    return ex.map(x=>x/s);
  }

  let logits = labels.map((_,i) => vec.reduce((sum,v,j) => sum + v * W[j][i], 0));
  let probs = softmax(logits);
  let idx = probs.indexOf(Math.max(...probs));

  document.getElementById('result-text').textContent = `Prediction: ${labels[idx]} (${(probs[idx]*100).toFixed(1)}%)`;

  let img = document.getElementById('result-image');
  img.src = `${labels[idx].toLowerCase()}.jpg`;
  img.style.display = 'block';
});
