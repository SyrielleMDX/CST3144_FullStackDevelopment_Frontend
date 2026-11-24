const ACTIVITIES = {
  'robot-warehouse': {
    engine: 'robot', label: 'Coding puzzle', title: 'Warehouse Run',
    intro: 'Program the robot to pick up both gears, then reach the loading dock. Avoid the crates!',
    size: 5, start: { r: 4, c: 0 }, goal: { r: 0, c: 4 },
    walls: [{ r: 3, c: 1 }, { r: 1, c: 1 }, { r: 1, c: 3 }, { r: 2, c: 3 }],
    items: [{ r: 4, c: 2 }, { r: 2, c: 4 }], itemIcon: 'fa-gear', itemName: 'gear', goalIcon: 'fa-warehouse', maxCommands: 12
  },
  'code-loop': {
    engine: 'order', label: 'Code ordering', title: 'Game Loop Builder', code: true,
    intro: 'Tap the lines in the order a real game runs them. Start from the very first line.',
    steps: ['score = 0', 'start the game loop', 'move the player when a key is pressed', 'if the player touches a coin: score = score + 1', 'draw the score on screen']
  },
  'sci-volcano': {
    engine: 'slider', label: 'Experiment', title: 'Volcano Lab', visual: 'fill', fillColour: '#FF7F3F', target: [55, 75],
    intro: 'Choose how much baking soda and vinegar to use. Aim for a tall eruption that stays inside the tray.',
    goalText: 'Make the foam reach the green zone.',
    sliders: [
      { id: 'soda', label: 'Baking soda', min: 1, max: 10, step: 1, value: 2, unit: ' spoons' },
      { id: 'vinegar', label: 'Vinegar', min: 50, max: 500, step: 50, value: 450, unit: ' ml' }
    ],
    evaluate(v) {
      const foam = Math.min(v.soda * 10, v.vinegar / 5);
      let tip = 'Perfect balance: a tall, safe eruption!';
      if (foam > 75) tip = 'Whoa, it overflows the tray! Use a little less of both.';
      else if (foam < 55) tip = v.soda * 10 < v.vinegar / 5 ? 'Vinegar is left over. Add more baking soda.' : 'Baking soda is left over. Add more vinegar.';
      return { meter: foam, readouts: ['Foam height: ' + Math.round(foam) + ' cm'], tip: tip };
    }
  },
  'makers-match': {
    engine: 'match', label: 'Matching game', title: 'Trash to Treasure',
    intro: 'Match each everyday item to the creation a Little Maker could turn it into.',
    pairs: [
      { left: { icon: 'fa-box-open', label: 'Egg box' }, right: 'Wiggly caterpillar' },
      { left: { icon: 'fa-bottle-water', label: 'Plastic bottle' }, right: 'Mini plant pot' },
      { left: { icon: 'fa-newspaper', label: 'Old newspaper' }, right: 'Papier-mâché mask' },
      { left: { icon: 'fa-socks', label: 'Odd sock' }, right: 'Silly hand puppet' }
    ]
  },
  'colour-lab': {
    engine: 'colour', label: 'Colour mixing', title: 'Mix the Palette',
    intro: 'Mix two primary colours to make each secondary colour. Three rounds, no brushes needed.',
    colours: [
      { id: 'red', name: 'Red', hex: '#E63946' },
      { id: 'yellow', name: 'Yellow', hex: '#FFD23F' },
      { id: 'blue', name: 'Blue', hex: '#3A86FF' }
    ],
    mixes: {
      'red+yellow': { name: 'Orange', hex: '#FF8C42' },
      'blue+yellow': { name: 'Green', hex: '#2FA84F' },
      'blue+red': { name: 'Purple', hex: '#8E44AD' }
    },
    rounds: ['Orange', 'Green', 'Purple']
  },
  'beat-maker': {
    engine: 'rhythm', label: 'Memory game', title: 'Copy the Beat', noun: 'beat', sound: true,
    intro: 'Listen to the drum pattern, then tap the pads in the same order. Each round gets longer.',
    pads: [
      { id: 0, name: 'Kick', freq: 130, icon: 'fa-circle-dot' }, { id: 1, name: 'Snare', freq: 196, icon: 'fa-drum' },
      { id: 2, name: 'Hat', freq: 330, icon: 'fa-compact-disc' }, { id: 3, name: 'Clap', freq: 440, icon: 'fa-hands-clapping' }
    ],
    patterns: [[0, 2, 1], [1, 0, 3, 2], [2, 2, 0, 3, 1]]
  },
  'dance-copy': {
    engine: 'rhythm', label: 'Memory game', title: 'Copy the Choreography', noun: 'routine', sound: false,
    intro: 'Watch the dance moves light up, then repeat the routine in the same order.',
    pads: [
      { id: 0, name: 'Clap', icon: 'fa-hands-clapping' }, { id: 1, name: 'Spin', icon: 'fa-rotate' },
      { id: 2, name: 'Jump', icon: 'fa-arrow-up' }, { id: 3, name: 'Step', icon: 'fa-shoe-prints' }
    ],
    patterns: [[0, 1, 2], [3, 3, 1, 2], [2, 0, 3, 1, 1]]
  },
  'drama-voices': {
    engine: 'quiz', label: 'Acting quiz', title: 'Find the Right Voice',
    intro: 'Good actors choose voice and body language on purpose. Can you?',
    questions: [
      { prompt: 'The line is “I never said that.” Which delivery shows the character is nervous?',
        options: ['Loud and fast, hands on hips', 'Quiet, shaky, eyes darting away', 'Slow and flat, staring straight ahead'], answer: 1,
        explain: 'Nervous characters speak softly, shake a little and avoid eye contact.' },
      { prompt: 'How can you show you’re freezing cold without saying a word?',
        options: ['Hug yourself and shiver', 'Fold your arms and yawn', 'Stretch and smile'], answer: 0,
        explain: 'Big, clear physical choices tell the audience what the character feels.' },
      { prompt: 'What helps someone at the back of the hall hear you?',
        options: ['Whispering', 'Speaking fast', 'Breathing deeply and projecting from your belly'], answer: 2,
        explain: 'Projection comes from breath support, not shouting.' }
    ]
  },
  'chef-pancakes': {
    engine: 'order', label: 'Recipe challenge', title: 'Pancake Order',
    intro: 'The recipe cards got shuffled! Tap the steps in the right order.',
    steps: ['Wash your hands', 'Whisk flour, eggs and milk into a smooth batter', 'Heat a little oil in the pan', 'Pour in a ladle of batter and wait for bubbles', 'Flip the pancake with a spatula', 'Serve with your favourite toppings']
  },
  'nature-habitats': {
    engine: 'match', label: 'Matching game', title: 'Home Sweet Habitat',
    intro: 'Every creature has a favourite home. Match each animal to where it lives.',
    pairs: [
      { left: { icon: 'fa-frog', label: 'Frog' }, right: 'Pond' },
      { left: { icon: 'fa-fish', label: 'Fish' }, right: 'Coral reef' },
      { left: { icon: 'fa-spider', label: 'Spider' }, right: 'Garden hedge' },
      { left: { icon: 'fa-dove', label: 'Dove' }, right: 'Tree top' },
      { left: { icon: 'fa-hippo', label: 'Hippo' }, right: 'River' }
    ]
  },
  'debate-rebuttal': {
    engine: 'quiz', label: 'Argument quiz', title: 'Win the Rebuttal',
    intro: 'Great debaters attack the argument, not the person. Pick the strongest move.',
    questions: [
      { prompt: 'Opponent: “Homework should be banned because I hate it.” Strongest rebuttal?',
        options: ['“You’re lying, nobody hates homework.”', '“Disliking something isn’t a reason. Short, focused homework helps learning.”', '“Everyone loves homework!”'], answer: 1,
        explain: 'A strong rebuttal answers the claim with a reason and evidence.' },
      { prompt: '“Everyone online agrees, so it must be true.” This is an example of…',
        options: ['Strong evidence', 'A bandwagon fallacy', 'A fair compromise'], answer: 1,
        explain: 'Popularity isn’t proof. That’s the bandwagon fallacy.' },
      { prompt: 'What’s the best way to open a speech?',
        options: ['Apologise for being nervous', 'Read the whole speech word for word', 'State your claim with one strong reason'], answer: 2,
        explain: 'A clear claim and reason gets the judges on your side straight away.' }
    ]
  },
  'photo-exposure': {
    engine: 'slider', label: 'Camera lab', title: 'Perfect Exposure', visual: 'photo', target: [42, 58],
    intro: 'Adjust the camera settings until the photo is neither too dark nor too bright.',
    goalText: 'Keep the exposure meter inside the green zone.',
    sliders: [
      { id: 'iso', label: 'ISO (sensor sensitivity)', min: 100, max: 1600, step: 100, value: 1600, unit: '' },
      { id: 'time', label: 'Shutter time', min: 1, max: 100, step: 1, value: 80, unit: ' ms' },
      { id: 'aperture', label: 'Aperture opening', min: 1, max: 8, step: 1, value: 7, unit: '' }
    ],
    evaluate(v) {
      const light = (v.iso / 400) * (v.time / 20) * (v.aperture / 4);
      const meter = Math.max(0, Math.min(100, 50 + 25 * Math.log2(light)));
      const tip = meter > 58 ? 'Overexposed! Let in less light.' : meter < 42 ? 'Underexposed! Let in more light.' : 'Beautifully exposed.';
      return { meter: meter, style: { filter: 'brightness(' + Math.max(0.15, Math.min(2.6, light)).toFixed(2) + ')' }, readouts: ['Light level: ' + light.toFixed(2) + 'x'], tip: tip };
    }
  },
  'web-basics': {
    engine: 'quiz', label: 'Code quiz', title: 'Web Dev Warm-up',
    intro: 'Three quick questions on the building blocks of every website.',
    questions: [
      { prompt: 'Which tag makes the biggest heading?', code: '<h1>Hello</h1>',
        options: ['<h6>', '<h1>', '<p>'], answer: 1, explain: '<h1> is the top-level heading. <h6> is the smallest.' },
      { prompt: 'Which value makes the button red?', code: 'button.style.background = ____;',
        options: ['red', '"red"', 'red;'], answer: 1, explain: 'Text values in JavaScript need quotes, so "red".' },
      { prompt: 'In CSS, what does the dot mean in this rule?', code: '.card { color: blue; }',
        options: ['It selects elements with class="card"', 'It ends the line', 'It makes the text bold'], answer: 0, explain: 'A dot selects by class name.' }
    ]
  },
  'study-technique': {
    engine: 'quiz', label: 'Study quiz', title: 'Study Smarter',
    intro: 'Revising harder isn’t the same as revising better. Test your instincts.',
    questions: [
      { prompt: 'Which method helps memory the most?',
        options: ['Rereading notes three times', 'Testing yourself without looking (active recall)', 'Highlighting everything in yellow'], answer: 1,
        explain: 'Pulling facts out of your memory strengthens them far more than rereading.' },
      { prompt: 'Your exam is in two weeks. Best plan?',
        options: ['Cram the night before', 'Short sessions spread over several days (spaced repetition)', 'One huge 8-hour session'], answer: 1,
        explain: 'Spacing sessions out fights forgetting.' },
      { prompt: 'Your focus slips after 40 minutes. What now?',
        options: ['A 5–10 minute break, then another focused block', 'An hour of social media', 'Push on without stopping'], answer: 0,
        explain: 'Short breaks recharge attention so the next block is better.' }
    ]
  },
  'biz-lemonade': {
    engine: 'slider', label: 'Business sim', title: 'Lemonade Stand', visual: 'fill', fillColour: '#E8A800', target: [90, 100],
    intro: 'Each cup costs Rs 15 to make. Set a price and how many cups to prepare, then maximise your profit.',
    goalText: 'Reach at least 90% of the best possible profit.',
    sliders: [
      { id: 'price', label: 'Price per cup', min: 10, max: 80, step: 5, value: 20, unit: ' Rs' },
      { id: 'stock', label: 'Cups prepared', min: 10, max: 100, step: 10, value: 100, unit: ' cups' }
    ],
    evaluate(v) {
      const demand = Math.max(0, 90 - v.price);
      const sold = Math.min(v.stock, demand);
      const profit = v.price * sold - 15 * v.stock;
      const meter = Math.max(0, Math.min(100, (profit / 1400) * 100));
      let tip = 'Great pricing and the right stock level!';
      if (meter < 90) tip = v.stock > demand ? 'Too many cups: unsold lemonade is wasted money.' : v.price < 40 ? 'Cheap cups sell fast but earn little. Try a higher price.' : 'Check whether your price or stock is holding you back.';
      return { meter: meter, readouts: ['Cups sold: ' + sold, 'Profit: Rs ' + profit], tip: tip };
    }
  },
  'write-show': {
    engine: 'quiz', label: 'Writing quiz', title: 'Show, Don’t Tell',
    intro: 'Strong writers let readers feel the story instead of explaining it.',
    questions: [
      { prompt: 'Which sentence SHOWS that she is nervous?',
        options: ['She was nervous.', 'Her fingers twisted the hem of her sleeve until it creased.', 'She felt a lot of nervousness inside.'], answer: 1,
        explain: 'Specific actions let the reader sense the feeling without being told.' },
      { prompt: 'Pick the strongest opening line.',
        options: ['It was a day.', 'The lighthouse lamp went out at midnight, and Nora hadn’t touched the switch.', 'Once upon a time there was a girl.'], answer: 1,
        explain: 'A strange, specific moment makes readers ask “what happens next?”.' },
      { prompt: 'Which detail brings in the sense of smell?',
        options: ['The room was a room.', 'The room smelled of burnt toast and old rain.', 'It was very interesting.'], answer: 1,
        explain: 'Sensory details make a scene feel real.' }
    ]
  },
  'chess-mate': {
    engine: 'chess', label: 'Chess puzzle', title: 'Mate in One',
    intro: 'White to move and checkmate in one. Select the rook, then choose its destination square.',
    pieces: [
      { icon: 'fa-chess-rook', name: 'white rook', sq: 'a1', side: 'w', movable: true },
      { icon: 'fa-chess-king', name: 'white king', sq: 'g1', side: 'w' },
      { icon: 'fa-chess-king', name: 'black king', sq: 'g8', side: 'b' },
      { icon: 'fa-chess-pawn', name: 'black pawn', sq: 'f7', side: 'b' },
      { icon: 'fa-chess-pawn', name: 'black pawn', sq: 'g7', side: 'b' },
      { icon: 'fa-chess-pawn', name: 'black pawn', sq: 'h7', side: 'b' }
    ],
    solution: { from: 'a1', to: 'a8' },
    hint: 'The black king is boxed in by its own pawns. Look at the back rank.'
  },
  'film-edit': {
    engine: 'order', label: 'Editing challenge', title: 'Cut the Scene',
    intro: 'You are the editor. Put the shots in the order that tells the story best.',
    steps: ['Wide shot: Maya walks through the school gates', 'Medium shot: she stops at her locker', 'Close-up: her hand opens the locker door', 'Insert: a mysterious note falls out', 'Close-up: her surprised face']
  }
};