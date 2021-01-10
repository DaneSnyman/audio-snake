const canvas = <HTMLCanvasElement>document.querySelector("canvas");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

// * Helpers
const mouse = {
  x: 0,
  y: 0,
};

addEventListener("mousemove", (ev: MouseEvent) => {
  mouse.x = ev.clientX;
  mouse.y = ev.clientY;
});

let direction = "";
addEventListener("keydown", (ev: KeyboardEvent) => {
  if (ev.key === "ArrowUp" && direction !== "down") {
    direction = "up";
  }

  if (ev.key === "ArrowDown" && direction !== "up") {
    direction = "down";
  }

  if (ev.key === "ArrowLeft" && direction !== "right") {
    direction = "left";
  }

  if (ev.key === "ArrowRight" && direction !== "left") {
    direction = "right";
  }
});

const randomizer = (max: number, isInt?: boolean, min?: number) => {
  const random = min ? Math.random() * (max - min) + min : Math.random() * max;
  return isInt ? Math.floor(random) : random;
};

const randomPosNeg = (num: number) => {
  return Math.random() > 0.5 ? -num : num;
};

const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

// * CLasses

// TODO: Speed needs work xD
let speed =
  canvas.height > canvas.width ? canvas.height / 100 : canvas.width / 100;

class Circle {
  x: number;
  y: number;
  r: number;
  s: number;
  i: number;
  color: string;

  constructor(x: number, y: number, r: number, i?: number) {
    this.x = x;
    this.y = y;
    this.r = r; // Radius
    this.s = speed;
    this.i = i;
    this.color = `rgb(${randomizer(255, true, 230)},${randomizer(
      230,
      true,
      200
    )},0`;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

const tailCoords = [];
const setCoords = (x: number, y: number) => {
  console.log({ x, y });
  tailCoords.push({ x, y });
};

const snakeArr = [];
let fruitArr = [];
class SnakeHead extends Circle {
  currentDirection: string;
  startAngle: number;
  endAngle: number;
  mouthSpeed = { r: 0.03, l: 0.03, u: 0.03, d: 0.03 };
  fltOpen = 1.0;
  mouth = {
    right: {
      start: 0,
      end: 2,
    },
    left: {
      start: 1.05,
      end: 0.9,
    },
    down: {
      start: 0.55,
      end: 0.4,
    },
    up: {
      start: 1.55,
      end: 1.4,
    },
  };

  drawHead() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, this.startAngle, this.endAngle);
    ctx.lineTo(this.x, this.y);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.beginPath();
    switch (direction) {
      case "right":
      case "left":
        ctx.arc(this.x, this.y - this.r / 2, this.r / 10, 0, 2 * Math.PI);
        break;

      case "up":
      case "down":
        ctx.arc(this.x - this.r / 2, this.y, this.r / 10, 0, 2 * Math.PI);
        break;

      default:
        ctx.arc(this.x, this.y - this.r / 2, this.r / 10, 0, 2 * Math.PI);
        break;
    }
    ctx.fillStyle = "#000";
    ctx.fill();
  }
  update() {
    if (this.currentDirection !== direction) {
      if (this.currentDirection) {
        setCoords(this.x, this.y);
      }
      this.currentDirection = direction;
    }

    if (direction === "right") {
      if (this.mouth.right.end < 1.8 || this.mouth.right.end > 2) {
        this.mouthSpeed.r = -this.mouthSpeed.r;
      }
      this.mouth.right.end -= this.mouthSpeed.r;
      this.mouth.right.start += this.mouthSpeed.r;
      this.startAngle = Math.PI * this.mouth.right.start;
      this.endAngle = Math.PI * this.mouth.right.end;
      this.x += this.s;
    }
    if (direction === "left") {
      if (this.mouth.left.start < 1 || this.mouth.left.start > 1.2) {
        this.mouthSpeed.l = -this.mouthSpeed.l;
      }
      this.mouth.left.end -= this.mouthSpeed.l;
      this.mouth.left.start += this.mouthSpeed.l;
      this.startAngle = Math.PI * this.mouth.left.start;
      this.endAngle = Math.PI * this.mouth.left.end;
      this.x -= this.s;
    }
    if (direction === "down") {
      if (this.mouth.down.start < 0.5 || this.mouth.down.start > 0.7) {
        this.mouthSpeed.d = -this.mouthSpeed.d;
      }
      this.mouth.down.end += this.mouthSpeed.d;
      this.mouth.down.start -= this.mouthSpeed.d;
      this.startAngle = Math.PI * this.mouth.down.start;
      this.endAngle = Math.PI * this.mouth.down.end;
      this.y += this.s;
    }
    if (direction === "up") {
      if (this.mouth.up.start < 1.5 || this.mouth.up.start > 1.7) {
        this.mouthSpeed.u = -this.mouthSpeed.u;
      }
      this.mouth.up.end += this.mouthSpeed.u;
      this.mouth.up.start -= this.mouthSpeed.u;
      this.startAngle = Math.PI * this.mouth.up.start;
      this.endAngle = Math.PI * this.mouth.up.end;
      this.y -= this.s;
    }

    if (!direction) {
      this.startAngle = 0;
      this.endAngle = Math.PI * 2;
    }

    this.drawHead();
  }
}

class SnakeTail extends Circle {
  checkPoint: number;
  prevSegment: Circle;
  constructor(
    x: number,
    y: number,
    r: number,
    i?: number,
    checkPoint?: number
  ) {
    super(x, y, r, i);
    this.checkPoint = checkPoint ? checkPoint : 0;
    this.prevSegment = snakeArr[this.i - 1];
    this.r -= this.i / 50;
  }

  checkDistance() {
    if (this.i === 1) {
      return (
        getDistance(this.x, this.y, this.prevSegment.x, this.prevSegment.y) >
        this.prevSegment.r * 1.5
      );
    } else {
      return (
        getDistance(this.x, this.y, this.prevSegment.x, this.prevSegment.y) >
        this.prevSegment.r * 2
      );
    }
  }

  update() {
    const wayPoint = tailCoords[this.checkPoint];

    if (wayPoint) {
      if (this.x < wayPoint.x && this.y === wayPoint.y && this.checkDistance())
        this.x += this.s;
      if (this.x > wayPoint.x && this.y === wayPoint.y && this.checkDistance())
        this.x -= this.s;
      if (this.y > wayPoint.y && this.x === wayPoint.x && this.checkDistance())
        this.y -= this.s;
      if (this.y < wayPoint.y && this.x === wayPoint.x && this.checkDistance())
        this.y += this.s;
      if (this.x === wayPoint.x && this.y === wayPoint.y) {
        this.checkPoint++;
      }
    } else {
      if (direction === "right" && this.checkDistance()) this.x += this.s;
      if (direction === "left" && this.checkDistance()) this.x -= this.s;
      if (direction === "down" && this.checkDistance()) this.y += this.s;
      if (direction === "up" && this.checkDistance()) this.y -= this.s;
    }

    this.draw();
  }
}
const circle = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  r: canvas.height / 60,
};

const spawnFruit = (fruitIndex: number) => {
  fruitArr.splice(fruitIndex, 1);
  // Fruit spawn

  if (fruitArr.length < 5) {
    const x = randomizer(canvas.width - circle.r * 2, true, 0 + circle.r * 2);
    const y = randomizer(canvas.height - circle.r * 2, true, 0 + circle.r * 2);
    fruitArr.push(new Fruit(x, y, circle.r));
  }

  // Add tail length
  snakeArr.push(
    new SnakeTail(
      snakeArr[snakeArr.length - 1].x,
      snakeArr[snakeArr.length - 1].y,
      circle.r,
      snakeArr.length,
      snakeArr.length > 1
        ? snakeArr[snakeArr.length - 1].checkPoint
        : tailCoords.length
    )
  );
};

class Fruit extends Circle {
  spawnedFruit = false;
  update() {
    const distance = getDistance(this.x, this.y, snakeArr[0].x, snakeArr[0].y);

    if (distance < this.r * 2.5 && !this.spawnedFruit) {
      this.spawnedFruit = true;
      spawnFruit(this.i);
    } else {
      this.spawnedFruit = false;
    }

    this.draw();
  }
}

const animate = () => {
  if (canvas.width !== innerWidth || canvas.height !== innerHeight) {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  requestAnimationFrame(animate);
  ctx.fillStyle = "rgba(20,20,20,1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  fruitArr.forEach((fruit) => fruit.update());
  snakeArr.forEach((shape) => shape.update());
};

const init = () => {
  for (let i = 0; i < 1; i++) {
    const x = randomizer(canvas.width - circle.r * 2, true, 0 + circle.r * 2);
    const y = randomizer(canvas.height - circle.r * 2, true, 0 + circle.r * 2);
    fruitArr.push(new Fruit(x, y, circle.r));
  }

  snakeArr.push(new SnakeHead(circle.x, circle.y, circle.r * 1.5, 0));
  animate();
};

init();
