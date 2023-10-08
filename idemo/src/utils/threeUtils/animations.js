//为三维对象提供动画效果

/**
 * @param {*} object  要旋转的对象
 * @param {*} clock Clock对象
 * @param {*} radiansPerSecond 每秒旋转的角度，默认360度
 */

function rotate(object, clock, radiansPerSecond = Math.PI * 2) {
  const rotationAngle = clock.getElapsedTime() * radiansPerSecond;
  object.rotation.y = rotationAngle;
}

function bounce(
  object,
  clock,
  bounceSpeed = 1.5,
  amplitude = 0.4,
  yLowerBound = 0.5
) {
  const elapsed = clock.getElapsedTime();
  const yPos = Math.abs(Math.sin(elapsed * bounceSpeed) * amplitude);
  object.position.y = yPos + yLowerBound;
}

export {rotate, bounce};
