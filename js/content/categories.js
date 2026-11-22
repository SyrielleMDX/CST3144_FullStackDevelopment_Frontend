const CATEGORIES = [
  { id: 'build', label: 'Build & Code', icon: 'fa-microchip', blurb: 'Robots, apps and gadgets', topics: ['Robotics', 'Coding'] },
  { id: 'make', label: 'Make & Create', icon: 'fa-paintbrush', blurb: 'Paint, film, write and cook', topics: ['Arts & Crafts', 'Painting', 'Cooking', 'Photography', 'Film', 'Writing'] },
  { id: 'move', label: 'Move & Perform', icon: 'fa-music', blurb: 'Dance, drum and drama', topics: ['Music', 'Dance', 'Drama'] },
  { id: 'explore', label: 'Explore & Discover', icon: 'fa-compass', blurb: 'Science and the outdoors', topics: ['Science', 'Nature'] },
  { id: 'think', label: 'Think & Lead', icon: 'fa-lightbulb', blurb: 'Debate, chess and business', topics: ['Debate', 'Chess', 'Business', 'Study Skills'] }
];

const CATEGORY_STYLE = {
  build: { sticker: 'flower', color: '#3DA66F' },
  make: { sticker: 'burst', color: '#FF6F91' },
  move: { sticker: 'squiggle', color: '#FF7F3F' },
  explore: { sticker: 'spark', color: '#E8A800' },
  think: { sticker: 'rings', color: '#4C94F0' }
};

function categoryOf(topic) {
  const found = CATEGORIES.find(function (c) { return c.topics.includes(topic); });
  return found ? found.id : 'explore';
}