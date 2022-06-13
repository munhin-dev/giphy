const board = document.querySelector(".board");
const difficulty = document.querySelector("#difficulty");
const mood = document.querySelector("#mood");
const displayTimer = document.querySelector(".timer");
const displayScore = document.querySelector(".score");
const startBtn = document.querySelector(".start-btn");
const loading = document.querySelector(".loading");
const gameSettings = document.querySelector(".game-settings");
let gameStarted = false;
let gameTimer;
let countdownTimer;
let countdownTimeout;

const getImage = async (keyword, size) => {
  const randomNumber = Math.floor(Math.random() * 1000);
  const res = await fetch(
    `https://api.giphy.com/v1/gifs/search?api_key=VSq4XjMAX1ceL6LwsQtRKJH9B1WNhu90&q=${keyword}&limit=${size}&offset=${randomNumber}&rating=g&lang=en`
  );
  const { data } = await res.json();
  return data.map(({ images }, index) => ({
    url: images.fixed_width_downsampled.url,
    key: index,
  }));
};

const shuffleImage = array => {
  for (let index = array.length - 1; index >= 0; index--) {
    const randomIndex = Math.floor(Math.random() * index);
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }

  return array;
};

const generateBoard = async (mood, difficulty) => {
  board.classList.remove("show-board");
  loading.classList.add("show-loading");
  let size;
  if (difficulty === "beginner") {
    size = "8";
    board.style.gridTemplateColumns = "repeat(4,1fr)";
  } else {
    size = "18";
    board.style.gridTemplateColumns = "repeat(6,1fr)";
  }

  let images = await getImage(mood, size);
  images = shuffleImage([...images, ...images]);
  images.forEach(image => {
    const card = document.createElement("div");
    const cover = document.createElement("div");
    const img = document.createElement("img");
    img.src = image.url;
    cover.classList.add("cover");
    cover.setAttribute("data-key", image.key);
    card.classList.add("card");
    card.append(img, cover);
    board.append(card);
  });
  await Promise.all(
    Array.from(document.images).map(
      image =>
        new Promise(resolve => {
          image.onload = resolve;
        })
    )
  );
  loading.classList.remove("show-loading");
  board.classList.add("show-board");
};

const pauseExecution = async milliseconds => {
  await new Promise(resolve => {
    board.style.pointerEvents = "none";
    countdownTimeout = setTimeout(() => {
      if (gameStarted) {
        resolve();
        board.style.pointerEvents = "auto";
      }
    }, milliseconds);
  });
  return countdownTimeout;
};

const startTimer = gameStarted => {
  let count = gameStarted ? 0 : 8;
  displayTimer.textContent = count;
  const timer = setInterval(() => {
    count = gameStarted ? count + 1 : count - 1;
    displayTimer.textContent = count;
  }, 1000);
  return timer;
};

const getFlipped = node =>
  Array.from(node).filter(
    card => card.classList.contains("show-card") && card.dataset.key
  );

const isMatch = cards =>
  cards.every(card => card.dataset.key === cards[0].dataset.key);

const allFlipped = node => Array.from(node).every(card => !card.dataset.key);

board.onclick = async event => {
  if (!event.target.classList.contains("cover")) {
    return;
  }
  console.log("test");
  event.target.classList.add("show-card");
  const cards = document.querySelectorAll(".cover");
  const flipped = getFlipped(cards);
  if (flipped.length === 1) {
    return;
  }

  if (isMatch(flipped)) {
    flipped.forEach(card => card.removeAttribute("data-key"));
    if (allFlipped(cards)) {
      gameStarted = false;
      clearInterval(gameTimer);
      const bestTime = Number(displayScore.textContent);
      const currentTime = Number(displayTimer.textContent);
      if (bestTime === 0 || currentTime < bestTime) {
        displayScore.textContent = currentTime;
      }

      startBtn.classList.toggle("hide-btn");
      startBtn.textContent = "Play Again";
    }
  } else {
    await pauseExecution(1000);
    cards.forEach(card => {
      if (card.dataset.key) {
        card.classList.remove("show-card");
      }
    });
  }
};

gameSettings.onchange = event => {
  gameStarted = false;
  if (event.target.id === "mood") {
    mood.value = event.target.value;
  } else {
    difficulty.value = event.target.value;
    displayScore.textContent = "0";
  }

  clearTimeout(countdownTimeout);
  clearInterval(gameTimer);
  clearInterval(countdownTimer);
  board.innerHTML = "";
  startBtn.classList.remove("hide-btn");
  startBtn.textContent = "Start Game";
  displayTimer.textContent = "0";
};

startBtn.onclick = async () => {
  board.innerHTML = "";
  startBtn.classList.toggle("hide-btn");
  await generateBoard(mood.value, difficulty.value);
  const cards = document.querySelectorAll(".cover");
  cards.forEach(card => card.classList.add("show-card"));
  countdownTimer = startTimer(gameStarted);
  gameStarted = true;
  countdownTimeout = await pauseExecution(8000);
  clearInterval(countdownTimer);
  cards.forEach(card => card.classList.remove("show-card"));
  gameTimer = startTimer(gameStarted);
};
