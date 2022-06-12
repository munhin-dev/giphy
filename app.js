const container = document.querySelector(".board");
const difficulty = document.querySelector("#difficulty");
const mood = document.querySelector("#mood");
const displayTimer = document.querySelector(".timer");
const startBtn = document.querySelector(".start-btn");
const highScore = document.querySelector(".high-score");
const gameSettings = document.querySelector(".game-settings");
let gameStarted = false;
let gameTimer;
let countdownTimer;
let countdownTimeout;

const getImage = async (keyword, size) => {
  const randomNumber = Math.floor(Math.random() * 300);
  const res = await fetch(
    `https://api.giphy.com/v1/gifs/search?api_key=VSq4XjMAX1ceL6LwsQtRKJH9B1WNhu90&q=${keyword}&limit=${size}&offset=${randomNumber}&rating=pg-13&lang=ja`
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

const generateBoard = async (anime, difficulty) => {
  let size;
  if (difficulty === "beginner") {
    size = "8";
    container.style.gridTemplateColumns = "repeat(4,1fr)";
  } else {
    size = "18";
    container.style.gridTemplateColumns = "repeat(6,1fr)";
  }

  let images = await getImage(anime, size);
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
    container.append(card);
  });
};

const pause = async milliseconds => {
  await new Promise(resolve => {
    container.style.pointerEvents = "none";
    countdownTimeout = setTimeout(() => {
      if (gameStarted) {
        resolve();
        container.style.pointerEvents = "auto";
      }
    }, milliseconds);
  });
  return countdownTimeout;
};

const timer = gameStarted => {
  let count;
  gameStarted ? (count = 0) : (count = 8);
  displayTimer.textContent = count;
  const timer = setInterval(() => {
    gameStarted ? count++ : count--;
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

container.onclick = async event => {
  if (!gameStarted) return;
  if (!event.target.classList.contains("cover")) return;
  event.target.classList.add("show-card");
  const cards = document.querySelectorAll(".cover");
  const flipped = getFlipped(cards);
  if (flipped.length === 1) return;
  if (isMatch(flipped)) {
    flipped.forEach(card => card.removeAttribute("data-key"));
    if (allFlipped(cards)) {
      gameStarted = false;
      clearInterval(gameTimer);
      if (
        Number(highScore.textContent) === 0 ||
        Number(displayTimer.textContent) < Number(highScore.textContent)
      ) {
        highScore.textContent = displayTimer.textContent;
      }
      startBtn.classList.toggle("hide-btn");
      startBtn.textContent = "Play Again";
      return;
    }
    return;
  }

  await pause(1000);
  cards.forEach(card => {
    if (card.dataset.key) {
      card.classList.remove("show-card");
    }
  });
};

gameSettings.onchange = event => {
  gameStarted = false;
  mood.value = event.target.id === "anime" ? event.target.value : mood.value;
  difficulty.value =
    event.target.id === "difficulty" ? event.target.value : difficulty.value;
  clearTimeout(countdownTimeout);
  clearInterval(gameTimer);
  clearInterval(countdownTimer);
  container.innerHTML = "";
  startBtn.classList.remove("hide-btn");
  startBtn.textContent = "Start Game";
  displayTimer.textContent = "0";
};

startBtn.onclick = async () => {
  container.innerHTML = "";
  startBtn.classList.toggle("hide-btn");
  await generateBoard(mood.value, difficulty.value);
  const cards = document.querySelectorAll(".cover");
  cards.forEach(card => card.classList.add("show-card"));
  countdownTimer = timer(gameStarted);
  gameStarted = true;
  countdownTimeout = await pause(8000);
  clearInterval(countdownTimer);
  cards.forEach(card => card.classList.remove("show-card"));
  gameTimer = timer(gameStarted);
};
