const TRAITS = {
  handson: 'hands-on',
  creative: 'creative',
  social: 'great with friends',
  active: 'active and energetic',
  logical: 'puzzle-solving',
  performing: 'performing',
  outdoors: 'outdoors',
  future: 'future skills',
  focus: 'calm and focused'
};

const AGE_GROUPS = [
  { id: 'kids', label: '6–9', min: 6, max: 9 },
  { id: 'tweens', label: '10–13', min: 10, max: 13 },
  { id: 'teens', label: '14–18', min: 14, max: 18 }
];

const QUIZ = [
  {
    id: 'age', question: 'Who are we finding classes for?', hint: 'We’ll only suggest classes that suit their age.',
    options: [
      { label: 'Ages 6–9', icon: 'fa-seedling', age: 'kids' },
      { label: 'Ages 10–13', icon: 'fa-bolt', age: 'tweens' },
      { label: 'Ages 14–18', icon: 'fa-rocket', age: 'teens' }
    ]
  },
  {
    id: 'fun', question: 'Which of these sounds the most fun?', hint: 'Pick the one that makes you smile first.',
    options: [
      { label: 'Building a robot, game or website', icon: 'fa-robot', cats: { build: 3 } },
      { label: 'Making art, films, stories or food', icon: 'fa-palette', cats: { make: 3 } },
      { label: 'Dancing, drumming or acting', icon: 'fa-music', cats: { move: 3 } },
      { label: 'Experiments, bugs and the outdoors', icon: 'fa-flask', cats: { explore: 3 } },
      { label: 'Debates, chess puzzles and big ideas', icon: 'fa-lightbulb', cats: { think: 3 } }
    ]
  },
  {
    id: 'style', question: 'How do you like to work?', hint: 'Think about when you are at your best.',
    options: [
      { label: 'Hands-on and a bit messy', icon: 'fa-hands', traits: { handson: 3, creative: 1 } },
      { label: 'In a team with friends', icon: 'fa-people-group', traits: { social: 3, performing: 1 } },
      { label: 'On my own, deep in focus', icon: 'fa-headphones', traits: { focus: 3, logical: 1 } },
      { label: 'Outside in the fresh air', icon: 'fa-tree', traits: { outdoors: 3, active: 1 } }
    ]
  },
  {
    id: 'energy', question: 'What is the energy like?', hint: 'Be honest, there is no wrong answer.',
    options: [
      { label: 'Calm and thoughtful', icon: 'fa-mug-hot', traits: { focus: 2, creative: 1, logical: 1 } },
      { label: 'Lively and on the move', icon: 'fa-person-running', traits: { active: 3, performing: 1 } },
      { label: 'A bit of both', icon: 'fa-shuffle', traits: { social: 1, creative: 1 } }
    ]
  },
  {
    id: 'goal', question: 'What would you love to get out of it?', hint: 'One last question!',
    options: [
      { label: 'Just have fun and make friends', icon: 'fa-face-laugh-beam', traits: { social: 2, creative: 1 } },
      { label: 'Learn a brand-new skill', icon: 'fa-wrench', traits: { handson: 2, logical: 2 } },
      { label: 'Perform and shine', icon: 'fa-star', traits: { performing: 3 } },
      { label: 'Get ready for the future', icon: 'fa-graduation-cap', traits: { future: 3, logical: 1 } }
    ]
  }
];

function ageGroupOf(answers) {
  const option = QUIZ[0].options[answers[0]];
  return option ? AGE_GROUPS.find(function (g) { return g.id === option.age; }) : null;
}

// give lessons score to match age group
function scoreLessons(lessons, answers, tried) {
  const catWeight = {};
  const traitWeight = {};
  QUIZ.forEach(function (q, i) {
    const option = q.options[answers[i]];
    if (!option) 
      return;
    Object.keys(option.cats || {}).forEach(function (k) { catWeight[k] = (catWeight[k] || 0) + option.cats[k]; });
    Object.keys(option.traits || {}).forEach(function (k) { traitWeight[k] = (traitWeight[k] || 0) + option.traits[k]; });
  });
  const group = ageGroupOf(answers);

  return lessons
    .filter(function (l) { 
      return !group || (l.ageMin <= group.max && l.ageMax >= group.min); 
    })
    .map(function (lesson) {
      const cat = categoryOf(lesson.topic);
      const catInfo = CATEGORIES.find(function (c) { 
        return c.id === cat; 
      });

      let score = (catWeight[cat] || 0) * 1.5;
      const reasons = [];

      if (catWeight[cat]) 
        reasons.push('Loves ' + catInfo.label.toLowerCase());
      (lesson.traits || []).forEach(function (t) {
        if (traitWeight[t]) { 
          score += traitWeight[t]; reasons.push(TRAITS[t]); 
        }
      });
      const record = tried && tried[lesson.previewType];
      if (record && record.score / record.max >= 0.6) { 
        score += 3; reasons.push('enjoyed the preview'); 
      }
      return { 
        lesson: lesson, 
        score: score, 
        reasons: reasons.slice(0, 3) 
      };
    })
    .sort(function (a, b) {
       return b.score - a.score || a.lesson.title.localeCompare(b.lesson.title); 
      });
}