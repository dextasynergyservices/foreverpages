// Minimal fixture for worker smoke test
function greet(name) {
  return `Hello, ${name}`;
}

console.log(greet("CI"));
