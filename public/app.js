'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const scenes = $$('.scene');
const chapterButtons = $$('.chapter-button');
const sceneDotButtons = $$('.scene-dots button');
let currentScene = 0;
let toastTimer = null;

const chapters = [
  {
    title: '01 · Mind reader?',
    minutes: 5,
    say: 'A clever result is not enough to tell us that a machine learned. First we need to ask how the result was produced.',
    ask: '“Is this AI?” Take a show-of-hands vote before revealing the decision tree.',
    steps: [
      'Have everyone silently choose one of the eight animals.',
      'Answer one or two questions while the decision process stays hidden.',
      'Reveal the decision tree, then continue answering so the class sees the chosen edges light up live.',
      'Try another animal with the tree open, then ask how they could break its fixed choices.'
    ],
    watch: 'Students may call every automated system AI. Emphasize that useful ordinary programs and learned models are both valuable—but they work differently.'
  },
  {
    title: '02 · How AI learns',
    minutes: 7,
    say: 'Traditional code gets an IF rule from a programmer. Machine learning gets labeled examples and training searches for the rule. The saved learned rule is the model.',
    ask: '“Which measurement and cutoff would you choose?” Later ask: “Who chose the rule this time—you or training?”',
    steps: [
      'In Write the rule, try YELLOWNESS at 50 and inspect the two mistakes.',
      'Change to LENGTH and tune the cutoff until the human rule gets 4 / 4.',
      'Switch to Train from examples and train on the four easy starter examples.',
      'Add the yellow apple and green banana, retrain, and watch the learned rule change.'
    ],
    watch: 'Avoid saying the model learns exactly like a human. It optimizes numerical patterns for a task; it does not gain human understanding.'
  },
  {
    title: '03 · Train a machine',
    minutes: 15,
    say: 'This is a real k-nearest-neighbor classifier. It remembers examples, measures distance, and lets the nearest examples vote.',
    ask: 'Before training, point at the mystery star and ask which species the room predicts. Ask again after changing k or adding one bad example.',
    steps: [
      'Train the starter dataset and inspect the colored prediction map.',
      'Move the mystery star; notice the lines to its nearest neighbors.',
      'Let pairs add samples and compare k = 1 with k = 7.',
      'Challenge them to bend the map with one misleading label.'
    ],
    watch: '“Confidence” here is only the fraction of nearby votes. It is not a guarantee and it is not calibrated like a production model.'
  },
  {
    title: '04 · Bias detective',
    minutes: 10,
    say: 'This is an image-classification simulation. Each new photo must be labeled BICYCLE or NOT BICYCLE. Lighting coverage in training changes which photos the classifier handles.',
    ask: 'Show the new night bicycle first: “The correct label is BICYCLE. Why might the model still output NOT BICYCLE?”',
    steps: [
      'Trace the visible flow: new photo → bicycle image classifier → one of two labels.',
      'Compare the 90 day and 10 night labeled training photos.',
      'Try the four new photos and read the correct label beside the model prediction.',
      'Compare the 96% overall score with 68% on night tests; toggle equal weighting.',
      'Balance the training photos, press Train, then test the night bicycle again.'
    ],
    watch: 'This panel is a teaching simulation, not a trained detector. Also explain that balancing counts is helpful but does not solve every kind of bias.'
  },
  {
    title: '05 · Word mixer',
    minutes: 13,
    say: 'The mini model repeatedly predicts a likely next word from counts in fifteen sentences. Real language models use neural networks, subword tokens, and far more data—but also generate step by step.',
    ask: 'Cover the probability panel and let students guess the next word. Then compare focused and wild temperature settings.',
    steps: [
      'Choose an opening and let students predict the next word.',
      'Click Pick one word several times while narrating the loop.',
      'Raise the temperature and generate a strange story.',
      'Use “discovered a secret tunnel” in the training experiment and read the before/after table.',
      'Teach the same example again to show how repeating data increases its influence.'
    ],
    watch: 'Do not imply that this n-gram counter is an LLM. It is an intentionally tiny analogy for tokens, probability, sampling, and limited training data.'
  },
  {
    title: '06 · Trust or check?',
    minutes: 10,
    say: 'Good AI use depends on the task, the stakes, privacy, and whether a human can check the result. Fluent wording is not proof.',
    ask: 'Have students vote with one, two, or three fingers. Ask one person to defend a different answer before revealing the safest first move.',
    steps: [
      'Vote on all five situations.',
      'Discuss why stakes change the amount of checking required.',
      'Reveal the three Ps and ask students to say one example of each.',
      'Finish: patterns, predictions, people.'
    ],
    watch: 'The choices are starting points, not universal policies. School rules and trusted adults still apply. For health or safety concerns, seek qualified human help.'
  }
];

function announce(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function showScene(index, moveFocus = false) {
  currentScene = Math.max(0, Math.min(scenes.length - 1, index));
  scenes.forEach((scene, sceneIndex) => scene.classList.toggle('active', sceneIndex === currentScene));
  chapterButtons.forEach((button, buttonIndex) => button.classList.toggle('active', buttonIndex === currentScene));
  sceneDotButtons.forEach((button, buttonIndex) => button.classList.toggle('active', buttonIndex === currentScene));

  $('#progressText').textContent = `${currentScene + 1} of ${scenes.length}`;
  $('#globalProgress').style.width = `${((currentScene + 1) / scenes.length) * 100}%`;
  $('#sceneDots').setAttribute('aria-label', `Chapter ${currentScene + 1} of ${scenes.length}`);
  $('#prevScene').disabled = currentScene === 0;
  $('#nextScene').disabled = currentScene === scenes.length - 1;
  $('#nextScene').innerHTML = currentScene === scenes.length - 1
    ? 'Workshop complete <span aria-hidden="true">&#10003;</span>'
    : 'Next mission <span aria-hidden="true">&rarr;</span>';

  updateNotes();
  if (currentScene === 2) requestAnimationFrame(drawKnn);
  if (moveFocus) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    $('#mainStage').focus({ preventScroll: true });
  }
}

chapterButtons.forEach(button => button.addEventListener('click', () => showScene(Number(button.dataset.scene), true)));
sceneDotButtons.forEach(button => button.addEventListener('click', () => showScene(Number(button.dataset.scene), true)));
$('#prevScene').addEventListener('click', () => showScene(currentScene - 1, true));
$('#nextScene').addEventListener('click', () => showScene(currentScene + 1, true));

// Workshop countdown timer
let secondsRemaining = 60 * 60;
let timerInterval = null;

function renderTimer() {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  $('#timerDisplay').textContent = display;
  $('#timerDisplay').setAttribute('datetime', `PT${minutes}M${seconds}S`);
  $('.workshop-clock').classList.toggle('expired', secondsRemaining === 0);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  $('#timerIcon').innerHTML = '&#9654;';
  $('#timerToggle').setAttribute('aria-label', 'Start workshop timer');
}

function toggleTimer() {
  if (timerInterval) {
    stopTimer();
    return;
  }
  if (secondsRemaining === 0) secondsRemaining = 60 * 60;
  $('#timerIcon').innerHTML = '&#10074;&#10074;';
  $('#timerToggle').setAttribute('aria-label', 'Pause workshop timer');
  timerInterval = setInterval(() => {
    secondsRemaining -= 1;
    renderTimer();
    if (secondsRemaining <= 0) {
      secondsRemaining = 0;
      stopTimer();
      renderTimer();
      announce('Time is up — finish with Patterns, Predictions, People.');
    }
  }, 1000);
}

$('#timerToggle').addEventListener('click', toggleTimer);
$('#timerReset').addEventListener('click', () => {
  stopTimer();
  secondsRemaining = 60 * 60;
  renderTimer();
});

// Teacher notes, focus view, and full screen
function updateNotes() {
  const chapter = chapters[currentScene];
  $('#notesTitle').textContent = chapter.title;
  $('#notesSay').textContent = chapter.say;
  $('#notesAsk').textContent = chapter.ask;
  $('#notesDo').replaceChildren(...chapter.steps.map(step => {
    const item = document.createElement('li');
    item.textContent = step;
    return item;
  }));
  $('#notesWatch').textContent = chapter.watch;
  $('#notesTime').textContent = `Suggested: ${chapter.minutes} minutes`;
  $('#notesNext').disabled = currentScene === chapters.length - 1;
}

function setNotesOpen(open) {
  const drawer = $('#notesDrawer');
  drawer.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', String(!open));
  $('#notesBtn').setAttribute('aria-expanded', String(open));
  $('#drawerScrim').hidden = !open;
  if (open) $('#closeNotes').focus();
}

$('#notesBtn').addEventListener('click', () => setNotesOpen(!$('#notesDrawer').classList.contains('open')));
$('#closeNotes').addEventListener('click', () => setNotesOpen(false));
$('#drawerScrim').addEventListener('click', () => setNotesOpen(false));
$('#notesNext').addEventListener('click', () => {
  if (currentScene < scenes.length - 1) {
    showScene(currentScene + 1);
    updateNotes();
  }
});

$('#focusBtn').addEventListener('click', () => {
  const isFocused = document.body.classList.toggle('focus-mode');
  $('#focusBtn').setAttribute('aria-pressed', String(isFocused));
  $('#focusBtn').textContent = isFocused ? 'Show chapters' : 'Focus view';
  if (currentScene === 2) requestAnimationFrame(drawKnn);
});

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch (error) {
    announce('Full screen is unavailable here. Use the browser menu instead.');
  }
}

$('#fullscreenBtn').addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', () => {
  const active = Boolean(document.fullscreenElement);
  $('#fullscreenBtn').textContent = active ? '\u2715' : '\u26F6';
  $('#fullscreenBtn').setAttribute('aria-label', active ? 'Exit full screen' : 'Enter full screen');
});

// Mission 1: deterministic decision tree
const mindTree = {
  root: { question: 'Does it spend most of its life in water?', yes: 'waterLungs', no: 'feathers' },
  waterLungs: { question: 'Does it breathe air with lungs?', yes: { animal: 'Dolphin' }, no: { animal: 'Shark' } },
  feathers: { question: 'Does it have feathers?', yes: 'flies', no: 'fur' },
  flies: { question: 'Can it usually fly?', yes: { animal: 'Eagle' }, no: { animal: 'Penguin' } },
  fur: { question: 'Does it have fur?', yes: 'barks', no: 'legs' },
  barks: { question: 'Is it famous for barking?', yes: { animal: 'Dog' }, no: { animal: 'Cat' } },
  legs: { question: 'Does it have legs?', yes: { animal: 'Lizard' }, no: { animal: 'Snake' } }
};

let mindNode = 'root';
let mindSteps = [];
let mindResult = null;
let mindTreeRevealed = false;

function treeTargetId(target) {
  return typeof target === 'string' ? target : target.animal.toLowerCase();
}

function dimTreeBranch(nodeId) {
  const questionNode = $(`[data-tree-node="${nodeId}"]`);
  const leafNode = $(`[data-tree-leaf="${nodeId}"]`);
  (questionNode || leafNode)?.classList.add('dimmed');
  if (!mindTree[nodeId]) return;
  ['yes', 'no'].forEach(answer => {
    const targetId = treeTargetId(mindTree[nodeId][answer]);
    $(`[data-edge-from="${nodeId}"][data-edge-answer="${answer}"]`)?.classList.add('rejected');
    dimTreeBranch(targetId);
  });
}

function renderMindTree() {
  $$('.tree-node').forEach(node => node.classList.remove('visited', 'current', 'result', 'dimmed'));
  $$('.tree-edge').forEach(edge => edge.classList.remove('chosen', 'rejected'));

  mindSteps.forEach(step => {
    $(`[data-tree-node="${step.nodeId}"]`)?.classList.add('visited');
    $(`[data-edge-from="${step.nodeId}"][data-edge-answer="${step.answerKey}"]`)?.classList.add('chosen');
    const opposite = step.answerKey === 'yes' ? 'no' : 'yes';
    const rejectedTarget = treeTargetId(mindTree[step.nodeId][opposite]);
    $(`[data-edge-from="${step.nodeId}"][data-edge-answer="${opposite}"]`)?.classList.add('rejected');
    dimTreeBranch(rejectedTarget);
  });

  if (mindResult) {
    $(`[data-tree-leaf="${mindResult.toLowerCase()}"]`)?.classList.add('result');
  } else {
    $(`[data-tree-node="${mindNode}"]`)?.classList.add('current');
  }

  const hiddenProgress = $('#mindHiddenProgress');
  hiddenProgress.textContent = mindSteps.length
    ? `${mindSteps.length} answer${mindSteps.length === 1 ? '' : 's'} recorded. Reveal the tree to see the chosen branches.`
    : 'Answer the robot, then reveal how every choice followed a branch.';

  const path = $('#mindPath');
  if (!mindSteps.length) {
    path.innerHTML = '<span>START</span><strong>Waiting for your first answer</strong>';
    return;
  }
  const trail = mindSteps.map(step => `${step.shortQuestion}: ${step.answer}`).join('  →  ');
  path.innerHTML = `<span>${mindResult ? 'GUESS' : 'PATH'}</span><strong>${trail}${mindResult ? `  →  ${mindResult.toUpperCase()}` : ''}</strong>`;
}

function answerMind(answer) {
  const node = mindTree[mindNode];
  const next = node[answer];
  const shortQuestions = {
    root: 'water', waterLungs: 'lungs', feathers: 'feathers', flies: 'flies', fur: 'fur', barks: 'barks', legs: 'legs'
  };
  mindSteps.push({
    nodeId: mindNode,
    question: node.question,
    shortQuestion: shortQuestions[mindNode],
    answerKey: answer,
    answer: answer === 'yes' ? 'YES' : 'NO',
    targetId: treeTargetId(next)
  });
  if (typeof next === 'string') {
    mindNode = next;
    $('#mindQuestion').textContent = mindTree[mindNode].question;
    renderMindTree();
    return;
  }
  mindResult = next.animal;
  $('#mindAnswerButtons').classList.add('hidden');
  $('#mindGuess').textContent = next.animal;
  $('#mindGuessBox').classList.remove('hidden');
  $('#mindQuestion').textContent = 'I followed your answers to the end of my tree.';
  if (mindTreeRevealed) $('#mindRestart').classList.remove('hidden');
  renderMindTree();
}

function revealMind(message) {
  mindTreeRevealed = true;
  $('#mindTreeLocked').classList.add('hidden');
  $('#mindTreePanel').classList.remove('hidden');
  $('#mindReveal').classList.remove('hidden');
  $('.tree-card .card-index').textContent = 'LIVE';
  if (mindResult) $('#mindRestart').classList.remove('hidden');
  renderMindTree();
  if (message) announce(message);
}

function resetMind(keepTreeOpen = false) {
  mindNode = 'root';
  mindSteps = [];
  mindResult = null;
  mindTreeRevealed = keepTreeOpen;
  $('#mindQuestion').textContent = mindTree.root.question;
  $('#mindAnswerButtons').classList.remove('hidden');
  $('#mindGuessBox').classList.add('hidden');
  $('#mindRestart').classList.add('hidden');
  $('#mindTreeLocked').classList.toggle('hidden', keepTreeOpen);
  $('#mindTreePanel').classList.toggle('hidden', !keepTreeOpen);
  $('#mindReveal').classList.toggle('hidden', !keepTreeOpen);
  $('.tree-card .card-index').textContent = keepTreeOpen ? 'LIVE' : 'HIDDEN';
  renderMindTree();
}

$('#mindYes').addEventListener('click', () => answerMind('yes'));
$('#mindNo').addEventListener('click', () => answerMind('no'));
$('#mindCorrect').addEventListener('click', () => revealMind('It looked smart because the rules fit your animal.'));
$('#mindFooled').addEventListener('click', () => revealMind('You found an edge case — fixed rules can be brittle.'));
$('#revealMindTrick').addEventListener('click', () => revealMind());
$('#mindRestart').addEventListener('click', () => resetMind(true));

// Mission 2: build the same fruit scanner with rules and with examples
const fruitTestSet = [
  { id: 'goldenTest', name: 'Golden apple', icon: '🍎', label: 'apple', yellow: 82, length: 33, curve: 19 },
  { id: 'tallTest', name: 'Tall apple', icon: '🍏', label: 'apple', yellow: 12, length: 43, curve: 22 },
  { id: 'greenBananaTest', name: 'Green banana', icon: '🍌', label: 'banana', yellow: 12, length: 78, curve: 70 },
  { id: 'straightBananaTest', name: 'Straight banana', icon: '🍌', label: 'banana', yellow: 70, length: 82, curve: 24 }
];

const fruitTrainingPool = [
  { id: 'redApple', name: 'Red apple', icon: '🍎', label: 'apple', yellow: 10, length: 25, curve: 15, starter: true },
  { id: 'greenApple', name: 'Green apple', icon: '🍏', label: 'apple', yellow: 5, length: 30, curve: 18, starter: true },
  { id: 'ripeBanana', name: 'Ripe banana', icon: '🍌', label: 'banana', yellow: 90, length: 85, curve: 85, starter: true },
  { id: 'smallBanana', name: 'Small banana', icon: '🍌', label: 'banana', yellow: 80, length: 65, curve: 65, starter: true },
  { id: 'yellowApple', name: 'Yellow apple', icon: '🍎', label: 'apple', yellow: 85, length: 34, curve: 20, tricky: true },
  { id: 'greenBanana', name: 'Green banana', icon: '🍌', label: 'banana', yellow: 8, length: 88, curve: 76, tricky: true }
];

const featureNames = { yellow: 'YELLOWNESS', length: 'LENGTH', curve: 'CURVE' };
let scannerMode = 'rules';
let humanRuleFeature = 'yellow';
let humanRuleRan = false;
let selectedTrainingFruit = new Set(fruitTrainingPool.filter(fruit => fruit.starter).map(fruit => fruit.id));
let fruitModel = null;
let fruitModelDirty = false;
let lastHumanPredictions = null;
let lastModelPredictions = null;

function fruitValueMarkup(fruit) {
  return `<i>Y ${fruit.yellow}</i><i>L ${fruit.length}</i><i>C ${fruit.curve}</i>`;
}

function renderFruitTestBench(predictions = null, sourceLabel = '') {
  const cards = fruitTestSet.map((fruit, index) => {
    const prediction = predictions?.[index];
    const correct = prediction === fruit.label;
    const resultMarkup = prediction
      ? `<div class="fruit-prediction ${correct ? 'correct' : 'wrong'}"><span>Predicted <strong>${prediction.toUpperCase()}</strong></span><b>${correct ? '✓' : '✕'}</b></div>`
      : '<div class="fruit-prediction"><span>Prediction hidden</span><b>?</b></div>';
    return `<article class="fruit-test-card"><span>${fruit.icon}</span><strong>${fruit.name}</strong><div class="fruit-values">${fruitValueMarkup(fruit)}</div>${resultMarkup}</article>`;
  });
  $('#fruitTestGrid').innerHTML = cards.join('');
  $('#testBenchMode').textContent = sourceLabel || (scannerMode === 'rules' ? 'Waiting for your human rule' : 'Waiting for a trained model');
}

function predictWithRule(fruit, rule) {
  const high = fruit[rule.feature] >= rule.threshold;
  if (rule.direction === 'highIsApple') return high ? 'apple' : 'banana';
  return high ? 'banana' : 'apple';
}

function scoreFruitRule(rows, rule) {
  return rows.reduce((score, fruit) => score + Number(predictWithRule(fruit, rule) === fruit.label), 0);
}

function currentHumanRule() {
  return { feature: humanRuleFeature, threshold: Number($('#ruleThreshold').value), direction: 'highIsBanana' };
}

function renderHumanRuleSentence() {
  const threshold = Number($('#ruleThreshold').value);
  $('#ruleThresholdOutput').textContent = threshold;
  $('#ruleSentence').innerHTML = `<span>IF</span> ${featureNames[humanRuleFeature]} &ge; ${threshold} <span>THEN</span> BANANA <span>ELSE</span> APPLE`;
}

function runHumanFruitRule() {
  const rule = currentHumanRule();
  lastHumanPredictions = fruitTestSet.map(fruit => predictWithRule(fruit, rule));
  const score = scoreFruitRule(fruitTestSet, rule);
  humanRuleRan = true;
  $('#humanRuleScore').textContent = `${score} / 4`;
  renderFruitTestBench(lastHumanPredictions, `Testing your ${featureNames[rule.feature].toLowerCase()} rule`);
  const feedback = $('#ruleFeedback');
  feedback.className = `scanner-feedback ${score === 4 ? 'success' : 'warning'}`;
  if (score === 4) {
    feedback.innerHTML = '<strong>4 / 4 correct.</strong> You chose the decision logic; the computer followed it exactly.';
  } else if (rule.feature === 'yellow') {
    feedback.innerHTML = `<strong>${score} / 4 correct.</strong> Color is fooled by the golden apple and green banana. Try LENGTH.`;
  } else {
    feedback.innerHTML = `<strong>${score} / 4 correct.</strong> This one rule misses an exception. Change the measurement or cutoff.`;
  }
  revealScannerComparisonIfReady();
}

function renderTrainingFruit() {
  $('#trainingFruitGrid').replaceChildren(...fruitTrainingPool.map(fruit => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `training-fruit${fruit.tricky ? ' tricky' : ''}`;
    button.dataset.fruitId = fruit.id;
    button.setAttribute('aria-pressed', String(selectedTrainingFruit.has(fruit.id)));
    button.innerHTML = `<span>${fruit.icon}</span><strong>${fruit.name} · ${fruit.label.toUpperCase()}</strong><small>Y ${fruit.yellow} · L ${fruit.length} · C ${fruit.curve}</small>`;
    button.addEventListener('click', () => toggleTrainingFruit(fruit.id));
    return button;
  }));
  updateTrainingSelection();
}

function selectedFruitRows() {
  return fruitTrainingPool.filter(fruit => selectedTrainingFruit.has(fruit.id));
}

function updateTrainingSelection() {
  const selected = selectedFruitRows();
  const apples = selected.filter(fruit => fruit.label === 'apple').length;
  const bananas = selected.length - apples;
  $('#trainingSelectionCount').textContent = `${selected.length} selected · ${apples} apple${apples === 1 ? '' : 's'} · ${bananas} banana${bananas === 1 ? '' : 's'}`;
  $('#trainFruitModel').textContent = `Train on ${selected.length} example${selected.length === 1 ? '' : 's'}`;
}

function toggleTrainingFruit(fruitId) {
  if (selectedTrainingFruit.has(fruitId)) selectedTrainingFruit.delete(fruitId);
  else selectedTrainingFruit.add(fruitId);
  const button = $(`[data-fruit-id="${fruitId}"]`);
  button?.setAttribute('aria-pressed', String(selectedTrainingFruit.has(fruitId)));
  updateTrainingSelection();
  if (fruitModel) {
    fruitModelDirty = true;
    $('#learningFeedback').className = 'scanner-feedback warning';
    $('#learningFeedback').innerHTML = '<strong>Data changed.</strong> The old model has not changed yet—press Train again.';
  }
}

function trainDecisionStump(rows) {
  let best = { score: -1, feature: 'yellow', threshold: 50, direction: 'highIsBanana' };
  ['yellow', 'length', 'curve'].forEach(feature => {
    const values = [...new Set(rows.map(row => row[feature]))].sort((a, b) => a - b);
    const thresholds = [values[0] - 1];
    for (let index = 0; index < values.length - 1; index += 1) thresholds.push((values[index] + values[index + 1]) / 2);
    thresholds.push(values[values.length - 1] + 1);
    thresholds.forEach(threshold => {
      ['highIsBanana', 'highIsApple'].forEach(direction => {
        const candidate = { feature, threshold, direction };
        const score = scoreFruitRule(rows, candidate);
        if (score > best.score) best = { ...candidate, score };
      });
    });
  });
  return best;
}

function trainFruitScanner() {
  const selected = selectedFruitRows();
  const labels = new Set(selected.map(fruit => fruit.label));
  if (selected.length < 2 || labels.size < 2) {
    $('#learningFeedback').className = 'scanner-feedback warning';
    $('#learningFeedback').innerHTML = '<strong>Cannot train yet.</strong> Select at least one apple and one banana.';
    return;
  }
  fruitModel = trainDecisionStump(selected);
  fruitModelDirty = false;
  lastModelPredictions = fruitTestSet.map(fruit => predictWithRule(fruit, fruitModel));
  const testScore = scoreFruitRule(fruitTestSet, fruitModel);
  const trainScore = scoreFruitRule(selected, fruitModel);
  const displayThreshold = Math.round(fruitModel.threshold);
  $('#learnedModelScore').textContent = `${testScore} / 4`;
  $('#pipelineData').textContent = `${selected.length} labeled examples`;
  $('#pipelineModel').textContent = `IF ${featureNames[fruitModel.feature]} ≥ ${displayThreshold} → ${fruitModel.direction === 'highIsBanana' ? 'BANANA' : 'APPLE'}`;
  $('#pipelinePredictions').textContent = `${testScore} / 4 correct`;
  $('#scannerPipeline').classList.remove('hidden');
  renderFruitTestBench(lastModelPredictions, `Learned ${featureNames[fruitModel.feature].toLowerCase()} rule`);

  const feedback = $('#learningFeedback');
  if (testScore === 4) {
    feedback.className = 'scanner-feedback success';
    feedback.innerHTML = `<strong>Training found LENGTH &ge; ${displayThreshold}.</strong> The tricky examples changed which rule won. Mystery score: 4 / 4.`;
  } else {
    feedback.className = 'scanner-feedback warning';
    feedback.innerHTML = `<strong>Training score ${trainScore}/${selected.length}; mystery score ${testScore}/4.</strong> It learned color from the easy examples. Add the yellow apple and green banana, then retrain.`;
    $$('[data-fruit-id="yellowApple"], [data-fruit-id="greenBanana"]').forEach(button => button.classList.add('pulse'));
    setTimeout(() => $$('[data-fruit-id]').forEach(button => button.classList.remove('pulse')), 1700);
  }
  revealScannerComparisonIfReady();
}

function revealScannerComparisonIfReady() {
  $('#scannerComparison').classList.toggle('hidden', !(humanRuleRan && fruitModel));
}

function setScannerMode(mode) {
  scannerMode = mode;
  $('#ruleBuilderPanel').classList.toggle('hidden', mode !== 'rules');
  $('#learningBuilderPanel').classList.toggle('hidden', mode !== 'learning');
  $$('[data-scanner-mode]').forEach(button => {
    const active = button.dataset.scannerMode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  if (mode === 'rules') renderFruitTestBench(lastHumanPredictions, lastHumanPredictions ? 'Your most recent human rule' : 'Waiting for your human rule');
  else renderFruitTestBench(lastModelPredictions, lastModelPredictions ? (fruitModelDirty ? 'Old model — retrain after data changes' : 'Your learned model') : 'Waiting for a trained model');
}

function resetFruitScanner() {
  scannerMode = 'rules';
  humanRuleFeature = 'yellow';
  humanRuleRan = false;
  selectedTrainingFruit = new Set(fruitTrainingPool.filter(fruit => fruit.starter).map(fruit => fruit.id));
  fruitModel = null;
  fruitModelDirty = false;
  lastHumanPredictions = null;
  lastModelPredictions = null;
  $('#ruleThreshold').value = 50;
  $('#humanRuleScore').textContent = '— / 4';
  $('#learnedModelScore').textContent = '— / 4';
  $('#ruleFeedback').className = 'scanner-feedback neutral';
  $('#ruleFeedback').innerHTML = '<strong>Your job:</strong> choose the IF rule. The computer will follow it exactly.';
  $('#learningFeedback').className = 'scanner-feedback neutral';
  $('#learningFeedback').innerHTML = '<strong>Your job:</strong> choose examples. Training will search for the IF rule.';
  $('#scannerPipeline').classList.add('hidden');
  $('#scannerComparison').classList.add('hidden');
  $$('[data-rule-feature]').forEach(button => button.classList.toggle('active', button.dataset.ruleFeature === 'yellow'));
  renderHumanRuleSentence();
  renderTrainingFruit();
  setScannerMode('rules');
}

$$('[data-scanner-mode]').forEach(button => button.addEventListener('click', () => setScannerMode(button.dataset.scannerMode)));
$$('[data-rule-feature]').forEach(button => button.addEventListener('click', () => {
  humanRuleFeature = button.dataset.ruleFeature;
  $$('[data-rule-feature]').forEach(other => other.classList.toggle('active', other === button));
  renderHumanRuleSentence();
  if (humanRuleRan) runHumanFruitRule();
}));
$('#ruleThreshold').addEventListener('input', () => {
  renderHumanRuleSentence();
  if (humanRuleRan) runHumanFruitRule();
});
$('#runHumanRule').addEventListener('click', runHumanFruitRule);
$('#trainFruitModel').addEventListener('click', trainFruitScanner);
$('#resetFruitTraining').addEventListener('click', () => {
  selectedTrainingFruit = new Set(fruitTrainingPool.filter(fruit => fruit.starter).map(fruit => fruit.id));
  renderTrainingFruit();
  if (fruitModel) {
    fruitModelDirty = true;
    $('#learningFeedback').className = 'scanner-feedback warning';
    $('#learningFeedback').innerHTML = '<strong>Starter data restored.</strong> Press Train to update the model.';
  }
});

// Mission 3: a real, tiny k-nearest-neighbor classifier
const knnCanvas = $('#knnCanvas');
const knnContext = knnCanvas.getContext('2d');
const plot = { left: 52, top: 22, right: 738, bottom: 388 };
const startingPoints = [
  { x: 0.14, y: 0.22, type: 'orbit' },
  { x: 0.24, y: 0.39, type: 'orbit' },
  { x: 0.34, y: 0.27, type: 'orbit' },
  { x: 0.40, y: 0.49, type: 'orbit' },
  { x: 0.62, y: 0.59, type: 'spark' },
  { x: 0.69, y: 0.77, type: 'spark' },
  { x: 0.81, y: 0.63, type: 'spark' },
  { x: 0.87, y: 0.83, type: 'spark' }
];
let knnPoints = startingPoints.map(point => ({ ...point }));
let knnTest = { x: 0.56, y: 0.48 };
let knnMode = 'orbit';
let knnTrained = false;

function dataToCanvas(point) {
  return {
    x: plot.left + point.x * (plot.right - plot.left),
    y: plot.bottom - point.y * (plot.bottom - plot.top)
  };
}

function canvasToData(x, y) {
  return {
    x: Math.max(0, Math.min(1, (x - plot.left) / (plot.right - plot.left))),
    y: Math.max(0, Math.min(1, (plot.bottom - y) / (plot.bottom - plot.top)))
  };
}

function classifyKnn(target) {
  if (!knnPoints.length) return null;
  const neighborLimit = Math.min(Number($('#neighborCount').value), knnPoints.length);
  const neighbors = knnPoints
    .map(point => ({ ...point, distance: (point.x - target.x) ** 2 + (point.y - target.y) ** 2 }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, neighborLimit);
  const orbitVotes = neighbors.filter(point => point.type === 'orbit').length;
  const sparkVotes = neighbors.length - orbitVotes;
  const winner = orbitVotes === sparkVotes ? neighbors[0].type : (orbitVotes > sparkVotes ? 'orbit' : 'spark');
  return { winner, orbitVotes, sparkVotes, total: neighbors.length, neighbors };
}

function drawTriangle(context, x, y, size, fill, stroke) {
  context.beginPath();
  context.moveTo(x, y - size);
  context.lineTo(x + size * 0.92, y + size * 0.8);
  context.lineTo(x - size * 0.92, y + size * 0.8);
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = stroke;
  context.lineWidth = 2;
  context.stroke();
}

function drawStar(context, x, y, outerRadius, innerRadius, fill, stroke) {
  context.beginPath();
  for (let pointIndex = 0; pointIndex < 10; pointIndex += 1) {
    const radius = pointIndex % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + pointIndex * Math.PI / 5;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (pointIndex === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = stroke;
  context.lineWidth = 3;
  context.stroke();
}

function drawKnn() {
  const context = knnContext;
  context.clearRect(0, 0, knnCanvas.width, knnCanvas.height);
  context.fillStyle = '#f8f8f4';
  context.fillRect(0, 0, knnCanvas.width, knnCanvas.height);

  if (knnTrained && knnPoints.length) {
    const cell = 14;
    context.globalAlpha = 0.17;
    for (let y = plot.top; y < plot.bottom; y += cell) {
      for (let x = plot.left; x < plot.right; x += cell) {
        const result = classifyKnn(canvasToData(x + cell / 2, y + cell / 2));
        context.fillStyle = result.winner === 'orbit' ? '#39d9f0' : '#ff8a4c';
        context.fillRect(x, y, Math.min(cell + 1, plot.right - x), Math.min(cell + 1, plot.bottom - y));
      }
    }
    context.globalAlpha = 1;
  }

  context.strokeStyle = '#deddd6';
  context.lineWidth = 1;
  for (let index = 0; index <= 10; index += 1) {
    const x = plot.left + (index / 10) * (plot.right - plot.left);
    const y = plot.top + (index / 10) * (plot.bottom - plot.top);
    context.beginPath(); context.moveTo(x, plot.top); context.lineTo(x, plot.bottom); context.stroke();
    context.beginPath(); context.moveTo(plot.left, y); context.lineTo(plot.right, y); context.stroke();
  }
  context.strokeStyle = '#7f8490';
  context.lineWidth = 2;
  context.beginPath(); context.moveTo(plot.left, plot.top); context.lineTo(plot.left, plot.bottom); context.lineTo(plot.right, plot.bottom); context.stroke();

  const result = knnTrained ? classifyKnn(knnTest) : null;
  if (result) {
    const testPosition = dataToCanvas(knnTest);
    result.neighbors.forEach((neighbor, index) => {
      const neighborPosition = dataToCanvas(neighbor);
      context.beginPath();
      context.moveTo(testPosition.x, testPosition.y);
      context.lineTo(neighborPosition.x, neighborPosition.y);
      context.strokeStyle = index === 0 ? '#5c42c4' : 'rgba(92, 66, 196, 0.47)';
      context.lineWidth = index === 0 ? 2.5 : 1.4;
      context.setLineDash(index === 0 ? [] : [5, 4]);
      context.stroke();
    });
    context.setLineDash([]);
  }

  knnPoints.forEach((point, index) => {
    const position = dataToCanvas(point);
    if (point.type === 'orbit') {
      context.beginPath();
      context.arc(position.x, position.y, 10, 0, Math.PI * 2);
      context.fillStyle = '#39d9f0';
      context.fill();
      context.strokeStyle = '#086c7b';
      context.lineWidth = 2.5;
      context.stroke();
    } else {
      drawTriangle(context, position.x, position.y, 11, '#ff8a4c', '#8f421c');
    }
    context.fillStyle = '#111629';
    context.font = 'bold 8px system-ui';
    context.textAlign = 'center';
    context.fillText(String(index + 1), position.x, position.y + 3);
  });

  const testPosition = dataToCanvas(knnTest);
  drawStar(context, testPosition.x, testPosition.y, 16, 7, '#c8f85c', '#51428d');
  context.fillStyle = '#36304f';
  context.font = '800 11px system-ui';
  context.textAlign = 'left';
  context.fillText('MYSTERY', Math.min(testPosition.x + 19, plot.right - 64), Math.max(testPosition.y - 14, plot.top + 12));

  updateKnnPrediction();
}

function updateKnnPrediction() {
  const orbitCount = knnPoints.filter(point => point.type === 'orbit').length;
  const sparkCount = knnPoints.length - orbitCount;
  $('#orbitCount').textContent = orbitCount;
  $('#sparkCount').textContent = sparkCount;
  $('#testX').value = Math.round(knnTest.x * 100);
  $('#testY').value = Math.round(knnTest.y * 100);
  $('#testXOutput').textContent = Math.round(knnTest.x * 100);
  $('#testYOutput').textContent = Math.round(knnTest.y * 100);

  if (!knnTrained || !knnPoints.length) {
    $('#knnPrediction').className = 'prediction-name';
    $('#knnPrediction').innerHTML = '<span>?</span><strong>No prediction yet</strong>';
    $('#orbitVoteBar').style.width = '50%';
    $('#sparkVoteBar').style.width = '50%';
    $('#orbitVotes').textContent = 'Orbit —';
    $('#sparkVotes').textContent = 'Spark —';
    $('#knnCanvasSummary').textContent = knnPoints.length
      ? `${knnPoints.length} examples are ready. Train the model to reveal its prediction map.`
      : 'The dataset is empty. Add examples before training.';
    return;
  }

  const result = classifyKnn(knnTest);
  const confidence = Math.round((Math.max(result.orbitVotes, result.sparkVotes) / result.total) * 100);
  const label = result.winner === 'orbit' ? 'ORBIT' : 'SPARK';
  const symbol = result.winner === 'orbit' ? '&#9675;' : '&#9650;';
  $('#knnPrediction').className = `prediction-name ${result.winner}`;
  $('#knnPrediction').innerHTML = `<span>${symbol}</span><strong>${label}<br><small>${confidence}% of neighbor votes</small></strong>`;
  $('#orbitVoteBar').style.width = `${(result.orbitVotes / result.total) * 100}%`;
  $('#sparkVoteBar').style.width = `${(result.sparkVotes / result.total) * 100}%`;
  $('#orbitVotes').textContent = `Orbit ${result.orbitVotes}`;
  $('#sparkVotes').textContent = `Spark ${result.sparkVotes}`;
  $('#knnCanvasSummary').textContent = `The ${result.total} nearest examples voted ${result.orbitVotes} Orbit to ${result.sparkVotes} Spark. Prediction: ${label} at ${confidence}% neighbor agreement.`;
}

function setKnnDirty() {
  if (knnTrained) {
    knnTrained = false;
    $('#knnState').className = 'model-state dirty';
    $('#knnState').innerHTML = '<span></span> Examples changed — train again';
  } else {
    $('#knnState').className = 'model-state';
    $('#knnState').innerHTML = '<span></span> Not trained yet';
  }
  drawKnn();
}

function trainKnn() {
  if (!knnPoints.length) {
    announce('Add at least one labeled example first.');
    return;
  }
  knnTrained = true;
  $('#knnState').className = 'model-state ready';
  $('#knnState').innerHTML = `<span></span> Ready — remembering ${knnPoints.length} examples`;
  $('#trainKnn').textContent = 'Retrain + update map';
  drawKnn();
}

function resetKnn() {
  knnPoints = startingPoints.map(point => ({ ...point }));
  knnTest = { x: 0.56, y: 0.48 };
  knnMode = 'orbit';
  knnTrained = false;
  $('#neighborCount').value = 3;
  $('#neighborOutput').textContent = '3';
  $('#trainKnn').textContent = 'Train + show the map';
  $('#knnState').className = 'model-state';
  $('#knnState').innerHTML = '<span></span> Not trained yet';
  $$('[data-knn-mode]').forEach(button => button.classList.toggle('active', button.dataset.knnMode === 'orbit'));
  $('#plotHint').textContent = 'Click the map to add an Orbit example.';
  drawKnn();
}

$$('[data-knn-mode]').forEach(button => button.addEventListener('click', () => {
  knnMode = button.dataset.knnMode;
  $$('[data-knn-mode]').forEach(other => other.classList.toggle('active', other === button));
  const instructions = {
    orbit: 'Click the map to add an Orbit example.',
    spark: 'Click the map to add a Spark example.',
    test: 'Click the map to move the mystery star.',
    erase: 'Click near a labeled dot to remove it.'
  };
  $('#plotHint').textContent = instructions[knnMode];
}));

knnCanvas.addEventListener('pointerdown', event => {
  const rectangle = knnCanvas.getBoundingClientRect();
  const canvasX = (event.clientX - rectangle.left) * (knnCanvas.width / rectangle.width);
  const canvasY = (event.clientY - rectangle.top) * (knnCanvas.height / rectangle.height);
  if (canvasX < plot.left || canvasX > plot.right || canvasY < plot.top || canvasY > plot.bottom) return;
  const point = canvasToData(canvasX, canvasY);

  if (knnMode === 'test') {
    knnTest = point;
    drawKnn();
    return;
  }
  if (knnMode === 'erase') {
    if (!knnPoints.length) return;
    const distances = knnPoints.map((sample, index) => ({ index, distance: (sample.x - point.x) ** 2 + (sample.y - point.y) ** 2 }));
    distances.sort((a, b) => a.distance - b.distance);
    if (distances[0].distance < 0.0045) {
      knnPoints.splice(distances[0].index, 1);
      setKnnDirty();
    }
    return;
  }
  if (knnPoints.length >= 50) {
    announce('Fifty dots are plenty for this tiny lab. Erase one to continue.');
    return;
  }
  knnPoints.push({ ...point, type: knnMode });
  setKnnDirty();
});

$('#neighborCount').addEventListener('input', event => {
  $('#neighborOutput').textContent = event.target.value;
  if (knnTrained) {
    $('#knnState').className = 'model-state dirty';
    $('#knnState').innerHTML = '<span></span> k changed — retrain to compare';
    knnTrained = false;
  }
  drawKnn();
});
$('#trainKnn').addEventListener('click', trainKnn);
$('#resetKnn').addEventListener('click', resetKnn);
$('#clearKnn').addEventListener('click', () => {
  knnPoints = [];
  setKnnDirty();
});
$('#testX').addEventListener('input', event => {
  knnTest.x = Number(event.target.value) / 100;
  drawKnn();
});
$('#testY').addEventListener('input', event => {
  knnTest.y = Number(event.target.value) / 100;
  drawKnn();
});

// Mission 4: explicit bicycle image-classification simulation
function coverageAccuracy(share) {
  return Math.round(50 + 50 * (1 - Math.exp(-share / 22)));
}

const bikeSamples = {
  dayBike: { name: 'day bicycle', condition: 'day', truth: 'BICYCLE', icon: '🚲', hard: false },
  nightBike: { name: 'night bicycle', condition: 'night', truth: 'BICYCLE', icon: '🚲', hard: true },
  dayScooter: { name: 'day scooter', condition: 'day', truth: 'NOT BICYCLE', icon: '🛴', hard: false },
  nightCar: { name: 'night car', condition: 'night', truth: 'NOT BICYCLE', icon: '🚗', hard: true }
};
let trainedDayShare = 90;
let bikeDatasetDirty = false;
let selectedBikeSample = 'nightBike';
let bikeReportMode = 'original';

function renderBikeTrainingDataset() {
  const dayShare = Number($('#biasBalance').value);
  const nightShare = 100 - dayShare;
  $('#dayDataLabel').textContent = dayShare;
  $('#nightDataLabel').textContent = nightShare;
  $('#dayBikeCount').textContent = `${dayShare / 2} labeled day bikes`;
  $('#dayNotBikeCount').textContent = `${dayShare / 2} labeled day cars`;
  $('#nightBikeCount').textContent = `${nightShare / 2} labeled night bikes`;
  $('#nightNotBikeCount').textContent = `${nightShare / 2} labeled night cars`;
}

function renderBikeSample() {
  const sample = bikeSamples[selectedBikeSample];
  const conditionShare = sample.condition === 'day' ? trainedDayShare : 100 - trainedDayShare;
  const neededShare = sample.hard ? 35 : 20;
  const isCorrect = conditionShare >= neededShare;
  const prediction = isCorrect ? sample.truth : (sample.truth === 'BICYCLE' ? 'NOT BICYCLE' : 'BICYCLE');
  const photo = $('#selectedBikePhoto');
  photo.className = `selected-photo ${sample.condition}`;
  photo.setAttribute('aria-label', `A ${sample.name} in a new ${sample.condition}time image`);
  $('#selectedBikeIcon').textContent = sample.icon;
  $('#selectedBikePhotoLabel').textContent = `NEW ${sample.condition.toUpperCase()} PHOTO`;
  $('#bikeCorrectLabel').textContent = sample.truth;
  $('#bikePredictionLabel').textContent = `${prediction} ${isCorrect ? '✓' : '✕'}`;
  $('#bikePredictionRow').className = isCorrect ? 'correct' : 'wrong';
  const explanation = $('#bikePhotoExplanation');
  if (isCorrect) {
    explanation.textContent = sample.condition === 'night'
      ? 'More dark training examples helped the classifier use the object’s shape in low light.'
      : `The training data contains enough similar ${sample.condition} images for this example.`;
  } else {
    explanation.textContent = sample.condition === 'night'
      ? `This hard ${sample.name} is classified incorrectly because the model saw very few dark training photos.`
      : `This ${sample.name} is classified incorrectly because too few similar daytime photos were in training.`;
  }
}

function renderBikeReport() {
  const nightShare = 100 - trainedDayShare;
  const dayAccuracy = coverageAccuracy(trainedDayShare);
  const nightAccuracy = coverageAccuracy(nightShare);
  const originalOverall = Math.round((90 * dayAccuracy + 10 * nightAccuracy) / 100);
  const equalOverall = Math.round((dayAccuracy + nightAccuracy) / 2);
  const overall = bikeReportMode === 'original' ? originalOverall : equalOverall;
  const dayCorrect = Math.round(90 * dayAccuracy / 100);
  const nightCorrect = Math.round(10 * nightAccuracy / 100);

  $('#dayAccuracy').textContent = `${dayAccuracy}%`;
  $('#nightAccuracy').textContent = `${nightAccuracy}%`;
  $('#dayAccuracyBar').style.width = `${dayAccuracy}%`;
  $('#nightAccuracyBar').style.width = `${nightAccuracy}%`;
  $('#dayTestCount').textContent = `${dayCorrect} / 90 correct`;
  $('#nightTestCount').textContent = `${nightCorrect} / 10 correct`;
  $('#biasHeadlineScore').textContent = `${overall}%`;

  const isOriginal = bikeReportMode === 'original';
  $('#overallReportLabel').textContent = isOriginal ? 'OVERALL ON ORIGINAL TEST MIX' : 'OVERALL WHEN CONDITIONS COUNT EQUALLY';
  $('#biasFormula').textContent = isOriginal
    ? `(90 × ${dayAccuracy}% + 10 × ${nightAccuracy}%) ÷ 100 ≈ ${originalOverall}%`
    : `(${dayAccuracy}% day + ${nightAccuracy}% night) ÷ 2 ≈ ${equalOverall}%`;
  $('#reportExplanation').textContent = isOriginal
    ? 'Most test photos are daytime, so the strong day result dominates the average.'
    : 'Same model and same condition results. Only the way the two conditions are averaged has changed.';

  const dayBlocks = isOriginal ? 9 : 5;
  $('#testComposition').replaceChildren(...Array.from({ length: 10 }, (_, index) => {
    const block = document.createElement('i');
    if (index >= dayBlocks) block.className = 'night';
    return block;
  }));
  $('#testComposition').setAttribute('aria-label', isOriginal
    ? 'Overall average gives 9 blocks of weight to day and 1 to night.'
    : 'Overall average gives 5 blocks of weight to day and 5 to night.');

  const dayPasses = dayAccuracy >= 90;
  const nightPasses = nightAccuracy >= 90;
  $('#dayPass').textContent = dayPasses ? 'PASS ✓' : 'NOT YET ✕';
  $('#dayPass').classList.toggle('fail', !dayPasses);
  $('#nightPass').textContent = nightPasses ? 'PASS ✓' : 'NOT YET ✕';
  $('#nightPass').classList.toggle('fail', !nightPasses);
  const solved = dayPasses && nightPasses;
  $('#biasChallenge').classList.toggle('solved', solved);
  $('#biasChallenge').innerHTML = solved
    ? `<span>&#10003;</span><p><strong>Challenge solved!</strong> Day is ${dayAccuracy}% and night rose from 68% to ${nightAccuracy}%, while the original headline is still ${originalOverall}%.</p>`
    : '<span>&#9675;</span><p><strong>Challenge not solved.</strong> Add more night training photos, retrain, and test the night bicycle again.</p>';

  renderBikeSample();
}

function trainBikeDetector() {
  trainedDayShare = Number($('#biasBalance').value);
  bikeDatasetDirty = false;
  const nightShare = 100 - trainedDayShare;
  $('#bikeTrainingStatus').className = 'bike-training-status ready';
  $('#bikeTrainingStatus').innerHTML = `<span></span> Model trained on ${trainedDayShare} day + ${nightShare} night photos.`;
  $('#trainBikeDetector').textContent = 'Retrain the bicycle classifier';
  renderBikeReport();
  announce('Bicycle classifier retrained. Check the night photo and report.');
}

$('#biasBalance').addEventListener('input', () => {
  bikeDatasetDirty = true;
  renderBikeTrainingDataset();
  $('#bikeTrainingStatus').className = 'bike-training-status dirty';
  $('#bikeTrainingStatus').innerHTML = '<span></span> Training photos changed — retrain the classifier.';
});
$('#balanceBias').addEventListener('click', () => {
  $('#biasBalance').value = 50;
  $('#biasBalance').dispatchEvent(new Event('input', { bubbles: true }));
  announce('Training photos balanced. Now press Train to update the model.');
});
$('#trainBikeDetector').addEventListener('click', trainBikeDetector);
$$('[data-bike-sample]').forEach(button => button.addEventListener('click', () => {
  selectedBikeSample = button.dataset.bikeSample;
  $$('[data-bike-sample]').forEach(other => other.classList.toggle('active', other === button));
  renderBikeSample();
}));
$$('[data-report-mode]').forEach(button => button.addEventListener('click', () => {
  bikeReportMode = button.dataset.reportMode;
  $$('[data-report-mode]').forEach(other => other.classList.toggle('active', other === button));
  renderBikeReport();
}));

function resetBias() {
  trainedDayShare = 90;
  bikeDatasetDirty = false;
  selectedBikeSample = 'nightBike';
  bikeReportMode = 'original';
  $('#biasBalance').value = 90;
  $('#trainBikeDetector').textContent = 'Train the bicycle classifier';
  $('#bikeTrainingStatus').className = 'bike-training-status ready';
  $('#bikeTrainingStatus').innerHTML = '<span></span> Current model: trained on 90 day + 10 night photos.';
  $$('[data-bike-sample]').forEach(button => button.classList.toggle('active', button.dataset.bikeSample === 'nightBike'));
  $$('[data-report-mode]').forEach(button => button.classList.toggle('active', button.dataset.reportMode === 'original'));
  renderBikeTrainingDataset();
  renderBikeReport();
}

// Mission 5: a real n-gram word predictor
const baseCorpus = [
  'The curious robot rolled into the old laboratory.',
  'The curious robot found a blue key under the stairs.',
  'The curious robot opened a tiny door on Mars.',
  'The brave robot rolled into the old laboratory.',
  'The brave robot found a silver key beside the rocket.',
  'The sleepy robot dreamed about electric sheep.',
  'In the old laboratory the robot built a paper rocket.',
  'In the old laboratory the robot painted a purple moon.',
  'On Mars the robot found a blue crystal.',
  'On Mars the robot met a dancing rover.',
  'After school Maya built a friendly robot.',
  'After school Maya taught the robot to dance.',
  'The robot learned to dance with a red umbrella.',
  'The robot learned to cook noodles on Mars.',
  'The robot said I can help and rolled away.'
];

let languageCorpus = [...baseCorpus];
let trigramModel = new Map();
let bigramModel = new Map();
let unigramModel = new Map();
let storyTokens = ['the', 'curious', 'robot'];
let randomState = 246813579;
let lastTrainingComparison = null;
let lastTaughtWord = null;

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?|[.!?]/g) || []);
}

function incrementWord(map, key, word) {
  if (!map.has(key)) map.set(key, new Map());
  const bucket = map.get(key);
  bucket.set(word, (bucket.get(word) || 0) + 1);
}

function buildLanguageModel() {
  trigramModel = new Map();
  bigramModel = new Map();
  unigramModel = new Map();
  languageCorpus.forEach(sentence => {
    const tokens = tokenize(sentence);
    if (!tokens.length) return;
    if (!['.', '!', '?'].includes(tokens[tokens.length - 1])) tokens.push('.');
    const sequence = ['<start>', '<start>', ...tokens];
    for (let index = 2; index < sequence.length; index += 1) {
      const word = sequence[index];
      incrementWord(trigramModel, `${sequence[index - 2]}\u0001${sequence[index - 1]}`, word);
      incrementWord(bigramModel, sequence[index - 1], word);
      unigramModel.set(word, (unigramModel.get(word) || 0) + 1);
    }
  });
}

function seededRandom() {
  randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
  return randomState / 4294967296;
}

function candidateCounts(tokens = storyTokens) {
  if (!tokens.length) return trigramModel.get('<start>\u0001<start>') || unigramModel;
  const last = tokens[tokens.length - 1];
  if (['.', '!', '?'].includes(last)) return trigramModel.get('<start>\u0001<start>') || unigramModel;
  const previous = tokens.length > 1 ? tokens[tokens.length - 2] : '<start>';
  return trigramModel.get(`${previous}\u0001${last}`) || bigramModel.get(last) || unigramModel;
}

function getWordDistribution(tokens = storyTokens, temperatureOverride = null) {
  const counts = candidateCounts(tokens);
  if (!counts || !counts.size) return [];
  const temperature = temperatureOverride ?? Number($('#temperature').value) / 10;
  const weighted = [...counts.entries()]
    .filter(([word]) => word !== '<start>')
    .map(([word, count]) => ({ word, weight: count ** (1 / temperature), count }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  return weighted
    .map(item => ({ ...item, probability: item.weight / total }))
    .sort((a, b) => b.probability - a.probability || a.word.localeCompare(b.word));
}

function displayWord(word) {
  if (word === '.') return 'end sentence .';
  if (word === '!') return 'end sentence !';
  if (word === '?') return 'end sentence ?';
  return word;
}

function formatStory(tokens) {
  if (!tokens.length) return '';
  let output = '';
  let capitalizeNext = true;
  tokens.forEach(token => {
    if (['.', '!', '?'].includes(token)) {
      output += token;
      capitalizeNext = true;
      return;
    }
    const displayed = capitalizeNext ? token.charAt(0).toUpperCase() + token.slice(1) : token;
    output += output ? ` ${displayed}` : displayed;
    capitalizeNext = false;
  });
  return output;
}

function renderLanguageModel() {
  $('#storyOutput').textContent = formatStory(storyTokens);
  const wordCount = storyTokens.filter(token => !['.', '!', '?'].includes(token)).length;
  $('#storyWordCount').textContent = `${wordCount} ${wordCount === 1 ? 'word' : 'words'}`;
  const atNewSentence = ['.', '!', '?'].includes(storyTokens.at(-1));
  const context = atNewSentence ? 'start of a new sentence' : storyTokens.slice(-2).join(' ');
  $('#modelContext').textContent = context || 'start of sentence';
  const distribution = getWordDistribution();
  const optionsRoot = $('#tokenOptions');
  const showingTrainingContext = storyTokens.slice(-3).join(' ') === 'the curious robot';
  const beforeProbabilities = new Map((lastTrainingComparison?.before || []).map(option => [option.word, option.probability]));

  const visibleOptions = distribution.slice(0, 5);
  optionsRoot.replaceChildren(...visibleOptions.map(option => {
    const button = document.createElement('button');
    button.type = 'button';
    const taughtHere = showingTrainingContext && option.word === lastTaughtWord;
    button.className = `token-button${taughtHere ? ' taught' : ''}`;
    button.style.setProperty('--probability', `${Math.max(3, option.probability * 100)}%`);
    button.dataset.word = option.word;
    const word = document.createElement('span');
    word.textContent = displayWord(option.word);
    const probability = document.createElement('strong');
    const before = beforeProbabilities.get(option.word) || 0;
    probability.textContent = taughtHere
      ? `${Math.round(option.probability * 100)}% · was ${Math.round(before * 100)}%`
      : `${Math.round(option.probability * 100)}%`;
    button.append(word, probability);
    button.addEventListener('click', () => appendStoryWord(option.word));
    return button;
  }));
  const modelKey = atNewSentence
    ? '<start>\u0001<start>'
    : `${storyTokens.at(-2) || '<start>'}\u0001${storyTokens.at(-1) || '<start>'}`;
  const modelKind = trigramModel.has(modelKey)
    ? 'two-word pattern'
    : (bigramModel.has(storyTokens.at(-1)) ? 'one-word fallback' : 'whole-corpus fallback');
  $('#modelNote').textContent = showingTrainingContext && lastTaughtWord
    ? `Your taught word is highlighted. These are the live after-training probabilities for the exact same prompt.`
    : `Using a ${modelKind}. Probabilities change with the training sentences and temperature.`;
}

function appendStoryWord(word) {
  storyTokens.push(word);
  renderLanguageModel();
}

function sampleNextWord() {
  const distribution = getWordDistribution();
  if (!distribution.length) {
    announce('That sentence has ended. Choose a new opening.');
    return false;
  }
  let pick = seededRandom();
  for (const option of distribution) {
    pick -= option.probability;
    if (pick <= 0) {
      appendStoryWord(option.word);
      return true;
    }
  }
  appendStoryWord(distribution[distribution.length - 1].word);
  return true;
}

function setStoryStarter(starter) {
  storyTokens = tokenize(starter).filter(token => !['.', '!', '?'].includes(token));
  randomState = 246813579;
  $$('#starterButtons button').forEach(button => button.classList.toggle('active', button.dataset.starter === starter));
  renderLanguageModel();
}

$$('#starterButtons button').forEach(button => button.addEventListener('click', () => setStoryStarter(button.dataset.starter)));
$('#sampleWord').addEventListener('click', sampleNextWord);
$('#generateEight').addEventListener('click', () => {
  for (let index = 0; index < 8; index += 1) {
    if (!sampleNextWord()) break;
  }
});
$('#resetStory').addEventListener('click', () => setStoryStarter('the curious robot'));
$('#temperature').addEventListener('input', event => {
  const value = Number(event.target.value) / 10;
  const name = value < 0.8 ? 'Focused' : (value > 1.3 ? 'Wild' : 'Balanced');
  $('#temperatureLabel').textContent = `${name} · ${value.toFixed(1)}`;
  renderLanguageModel();
});

function probabilityFor(distribution, word) {
  return distribution.find(option => option.word === word)?.probability || 0;
}

function updateCorpusEquation() {
  const customCount = languageCorpus.length - baseCorpus.length;
  $('#customCorpusCount').textContent = customCount;
  $('#corpusCount').textContent = languageCorpus.length;
}

function renderTrainingComparison() {
  const comparison = lastTrainingComparison;
  if (!comparison) {
    $('.proof-placeholder').classList.remove('hidden');
    $('#trainingComparison').classList.add('hidden');
    return;
  }
  $('.proof-placeholder').classList.add('hidden');
  $('#trainingComparison').classList.remove('hidden');
  $('#trainingSentenceEcho').textContent = `Example ${languageCorpus.length} added: “${comparison.sentence}”`;

  const beforeMap = new Map(comparison.before.map(option => [option.word, option.probability]));
  const afterMap = new Map(comparison.after.map(option => [option.word, option.probability]));
  const otherWords = [...new Set([
    ...comparison.before.map(option => option.word),
    ...comparison.after.map(option => option.word)
  ])]
    .filter(word => word !== comparison.taughtWord && !['.', '!', '?'].includes(word))
    .sort((a, b) => (afterMap.get(b) || 0) - (afterMap.get(a) || 0))
    .slice(0, 3);
  const words = [comparison.taughtWord, ...otherWords];
  $('#trainingComparisonRows').replaceChildren(...words.map(word => {
    const before = Math.round((beforeMap.get(word) || 0) * 100);
    const after = Math.round((afterMap.get(word) || 0) * 100);
    const row = document.createElement('div');
    row.className = `comparison-row${word === comparison.taughtWord ? ' taught' : ''}`;
    row.innerHTML = `<strong>${word}</strong><span>${before}% before</span><i>&rarr;</i><b>${after}% now</b>`;
    return row;
  }));
  const taughtBefore = Math.round(probabilityFor(comparison.before, comparison.taughtWord) * 100);
  const taughtAfter = Math.round(probabilityFor(comparison.after, comparison.taughtWord) * 100);
  $('#trainingExplanation').textContent = taughtAfter > taughtBefore
    ? `“${comparison.taughtWord}” rose from ${taughtBefore}% to ${taughtAfter}% because the model has now counted this pattern. Other words share the remaining probability.`
    : `The example was counted. Repeating an existing pattern can reinforce its probability even when rounding hides a small change.`;
}

function teachCustomCompletion(completionText) {
  const input = $('#newTrainingSentence');
  const completion = completionText.trim();
  const completionTokens = tokenize(completion).filter(token => !['.', '!', '?'].includes(token));
  if (!completionTokens.length) {
    $('#trainingError').textContent = 'Add at least one word after “The curious robot”.';
    $('#trainingError').classList.remove('hidden');
    input.focus();
    return;
  }
  $('#trainingError').classList.add('hidden');
  $('#temperature').value = 10;
  $('#temperatureLabel').textContent = 'Balanced · 1.0';
  const contextTokens = ['the', 'curious', 'robot'];
  const before = getWordDistribution(contextTokens, 1);
  const sentence = `The curious robot ${completion}`;
  const taughtWord = completionTokens[0];
  languageCorpus.push(sentence);
  buildLanguageModel();
  const after = getWordDistribution(contextTokens, 1);
  storyTokens = [...contextTokens];
  lastTaughtWord = taughtWord;
  lastTrainingComparison = { sentence, completion, taughtWord, before, after };
  $$('#starterButtons button').forEach(button => button.classList.toggle('active', button.dataset.starter === 'the curious robot'));
  updateCorpusEquation();
  renderLanguageModel();
  renderTrainingComparison();
  input.value = completion;
  $('#addTrainingSentence').textContent = 'Taught ✓ — compare on the right';
  setTimeout(() => { $('#addTrainingSentence').textContent = 'Teach this example + compare'; }, 1800);
  announce(`Model updated: “${taughtWord}” is now in the prediction.`);
}

$('#addTrainingSentence').addEventListener('click', () => teachCustomCompletion($('#newTrainingSentence').value));
$('#newTrainingSentence').addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    teachCustomCompletion(event.currentTarget.value);
  }
});
$('#fillTrainingExample').addEventListener('click', () => {
  $('#newTrainingSentence').value = 'discovered a secret tunnel.';
  $('#newTrainingSentence').focus();
});
$('#repeatTrainingSentence').addEventListener('click', () => {
  if (lastTrainingComparison) teachCustomCompletion(lastTrainingComparison.completion);
});
$('#useTaughtWord').addEventListener('click', () => {
  if (!lastTaughtWord) return;
  storyTokens = ['the', 'curious', 'robot', lastTaughtWord];
  renderLanguageModel();
  $('.story-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
$('#clearCustomTraining').addEventListener('click', () => {
  languageCorpus = [...baseCorpus];
  lastTrainingComparison = null;
  lastTaughtWord = null;
  buildLanguageModel();
  updateCorpusEquation();
  renderTrainingComparison();
  setStoryStarter('the curious robot');
  announce('Your added examples were cleared. The original probabilities are back.');
});

function resetLanguage(clearCustom = false) {
  if (clearCustom) {
    languageCorpus = [...baseCorpus];
    lastTrainingComparison = null;
    lastTaughtWord = null;
  }
  buildLanguageModel();
  updateCorpusEquation();
  $('#temperature').value = 10;
  $('#temperatureLabel').textContent = 'Balanced · 1.0';
  $('#newTrainingSentence').value = '';
  $('#trainingError').classList.add('hidden');
  renderTrainingComparison();
  setStoryStarter('the curious robot');
}

// Mission 6: responsible-use scenarios
const trustScenarios = [
  {
    icon: '🎉',
    title: 'Ask AI for ten science-club party themes',
    detail: 'Low stakes, no private data, and you will choose the final idea.',
    answer: 'use',
    feedbackTitle: 'Useful helper',
    feedback: 'Brainstorming is low stakes. A person still chooses what fits the group.'
  },
  {
    icon: '📚',
    title: 'Use an AI summary instead of reading the source for a graded project',
    detail: 'The model sounds confident, but details and quotations matter.',
    answer: 'check',
    feedbackTitle: 'Verify against the source',
    feedback: 'Summaries can omit or invent details. Read the original and follow your school’s rules.'
  },
  {
    icon: '🩺',
    title: 'Ask AI whether a classmate’s chest pain is serious',
    detail: 'A wrong answer could delay urgent help.',
    answer: 'human',
    feedbackTitle: 'High stakes need qualified people',
    feedback: 'Tell a trusted adult and seek appropriate medical help. Do not delegate urgent health decisions to a chatbot.'
  },
  {
    icon: '⚖️',
    title: 'Let AI decide which student should be suspended',
    detail: 'The decision affects rights, education, and a person’s future.',
    answer: 'human',
    feedbackTitle: 'Humans remain accountable',
    feedback: 'AI can reproduce bias and miss context. A responsible human process must own consequential decisions.'
  },
  {
    icon: '🔒',
    title: 'Paste a private group chat into AI and ask who is lying',
    detail: 'The messages include names, phone numbers, and personal details.',
    answer: 'human',
    feedbackTitle: 'Protect privacy and relationships',
    feedback: 'Do not upload other people’s private information. A model also cannot reliably determine who is truthful.'
  }
];

let scenarioIndex = 0;
let trustScore = 0;
let scenarioAnswered = false;

function renderTrustScenario() {
  const scenario = trustScenarios[scenarioIndex];
  $('#scenarioNumber').textContent = `SCENARIO ${scenarioIndex + 1} / ${trustScenarios.length}`;
  $('#scenarioProgressBar').style.width = `${((scenarioIndex + 1) / trustScenarios.length) * 100}%`;
  $('#scenarioIcon').textContent = scenario.icon;
  $('#scenarioTitle').textContent = scenario.title;
  $('#scenarioDetail').textContent = scenario.detail;
  $('#scenarioFeedback').classList.add('hidden');
  $('#nextScenario').textContent = scenarioIndex === trustScenarios.length - 1 ? 'See exit ticket →' : 'Next scenario →';
  $$('#trustChoices button').forEach(button => {
    button.disabled = false;
    button.classList.remove('selected', 'correct', 'incorrect');
  });
  scenarioAnswered = false;
}

function updateTrustScore() {
  $('#trustScore').textContent = trustScore;
  $('#scorePips').setAttribute('aria-label', `Score: ${trustScore} out of ${trustScenarios.length}`);
  $$('#scorePips i').forEach((pip, index) => pip.classList.toggle('filled', index < trustScore));
}

$$('#trustChoices button').forEach(button => button.addEventListener('click', () => {
  if (scenarioAnswered) return;
  scenarioAnswered = true;
  const scenario = trustScenarios[scenarioIndex];
  const isCorrect = button.dataset.choice === scenario.answer;
  if (isCorrect) trustScore += 1;
  updateTrustScore();

  $$('#trustChoices button').forEach(choiceButton => {
    choiceButton.disabled = true;
    choiceButton.classList.toggle('selected', choiceButton === button);
    choiceButton.classList.toggle('correct', choiceButton.dataset.choice === scenario.answer);
    choiceButton.classList.toggle('incorrect', choiceButton === button && !isCorrect);
  });
  $('#feedbackMark').textContent = isCorrect ? 'STRONG FIRST MOVE' : 'A SAFER START';
  $('#feedbackTitle').textContent = scenario.feedbackTitle;
  $('#feedbackCopy').textContent = scenario.feedback;
  $('#scenarioFeedback').classList.remove('hidden');
}));

$('#nextScenario').addEventListener('click', () => {
  if (scenarioIndex < trustScenarios.length - 1) {
    scenarioIndex += 1;
    renderTrustScenario();
  } else {
    $('#finale').classList.remove('hidden');
    $('#nextScenario').classList.add('hidden');
    $('#finale').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});

function resetTrust() {
  scenarioIndex = 0;
  trustScore = 0;
  $('#finale').classList.add('hidden');
  $('#threePs').classList.add('hidden');
  $('#revealFinale').classList.remove('hidden');
  $('#nextScenario').classList.remove('hidden');
  updateTrustScore();
  renderTrustScenario();
}

$('#restartTrust').addEventListener('click', resetTrust);
$('#revealFinale').addEventListener('click', () => {
  $('#threePs').classList.remove('hidden');
  $('#revealFinale').classList.add('hidden');
});

function resetCurrentActivity() {
  const resetters = [resetMind, resetFruitScanner, resetKnn, resetBias, () => resetLanguage(true), resetTrust];
  resetters[currentScene]();
  announce('This activity is back at its starting point.');
}

document.addEventListener('keydown', event => {
  const tag = event.target.tagName;
  const editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || event.target.isContentEditable;
  if (event.key === 'Escape' && $('#notesDrawer').classList.contains('open')) {
    setNotesOpen(false);
    $('#notesBtn').focus();
    return;
  }
  if (editing) return;
  if (event.key === 'ArrowRight') showScene(currentScene + 1, true);
  if (event.key === 'ArrowLeft') showScene(currentScene - 1, true);
  if (event.key.toLowerCase() === 'n') setNotesOpen(!$('#notesDrawer').classList.contains('open'));
  if (event.key.toLowerCase() === 'f') toggleFullscreen();
  if (event.key.toLowerCase() === 'r') resetCurrentActivity();
});

// Initial render
resetMind();
resetFruitScanner();
drawKnn();
resetBias();
resetLanguage(true);
resetTrust();
renderTimer();
const requestedScene = Number(new URLSearchParams(window.location.search).get('scene'));
showScene(Number.isInteger(requestedScene) && requestedScene >= 1 && requestedScene <= scenes.length ? requestedScene - 1 : 0);
