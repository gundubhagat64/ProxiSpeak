const users = [
  { userId: "test-user", x: 400, y: 300 },
  { userId: "near-user-1", x: 450, y: 300 },
  { userId: "near-user-2", x: 490, y: 300 },
  { userId: "far-user", x: 520, y: 300 }
];

// Calculate distances from the first user to all other users

const currentUser = users[0];

users.slice(1).forEach((user) => {
  const dx = user.x - currentUser.x;
  const dy = user.y - currentUser.y;

  const distance = Math.sqrt(dx * dx + dy * dy);

  console.log(`${user.userId}: ${distance}px`);
});