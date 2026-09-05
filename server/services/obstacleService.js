/**
 * Week 4 - ProxiSpeak
 * Sound obstacle / line-of-sight engine
 */

/**
 * Check whether two points are equal.
 */
function pointsEqual(a, b) {
  return a.x === b.x && a.y === b.y;
}

/**
 * Cross product.
 */
function cross(a, b, c) {
  return (
    (b.x - a.x) * (c.y - a.y) -
    (b.y - a.y) * (c.x - a.x)
  );
}

/**
 * Check whether point q lies on segment pr.
 */
function onSegment(p, q, r) {
  return (
    q.x >= Math.min(p.x, r.x) &&
    q.x <= Math.max(p.x, r.x) &&
    q.y >= Math.min(p.y, r.y) &&
    q.y <= Math.max(p.y, r.y)
  );
}

/**
 * Check if two line segments intersect.
 */
function segmentsIntersect(p1, p2, q1, q2) {
  const d1 = cross(p1, p2, q1);
  const d2 = cross(p1, p2, q2);
  const d3 = cross(q1, q2, p1);
  const d4 = cross(q1, q2, p2);

  if (
    ((d1 > 0 && d2 < 0) ||
      (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) ||
      (d3 < 0 && d4 > 0))
  ) {
    return true;
  }

  if (d1 === 0 && onSegment(p1, q1, p2)) return true;
  if (d2 === 0 && onSegment(p1, q2, p2)) return true;
  if (d3 === 0 && onSegment(q1, p1, q2)) return true;
  if (d4 === 0 && onSegment(q1, p2, q2)) return true;

  return false;
}

/**
 * Get rectangle edges.
 */
function getRectangleEdges(rect) {
  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;

  const topLeft = {
    x: left,
    y: top
  };

  const topRight = {
    x: right,
    y: top
  };

  const bottomLeft = {
    x: left,
    y: bottom
  };

  const bottomRight = {
    x: right,
    y: bottom
  };

  return [
    [topLeft, topRight],
    [topRight, bottomRight],
    [bottomRight, bottomLeft],
    [bottomLeft, topLeft]
  ];
}

/**
 * Check if a point lies inside rectangle.
 */
function pointInsideRectangle(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Check if audio path intersects obstacle.
 */
function pathIntersectsObstacle(source, target, obstacle) {
  if (pointInsideRectangle(source, obstacle)) {
    return true;
  }

  if (pointInsideRectangle(target, obstacle)) {
    return true;
  }

  const edges = getRectangleEdges(obstacle);

  return edges.some(([start, end]) =>
    segmentsIntersect(
      source,
      target,
      start,
      end
    )
  );
}

/**
 * Find all obstacles between two users.
 */
function findBlockingObstacles(
  source,
  target,
  obstacles = []
) {
  return obstacles.filter((obstacle) => {
    if (!obstacle.blocksSound) {
      return false;
    }

    return pathIntersectsObstacle(
      source,
      target,
      obstacle
    );
  });
}

/**
 * Calculate obstacle attenuation.
 *
 * 0 = no attenuation
 * 1 = complete block
 */
function calculateObstacleAttenuation(
  source,
  target,
  obstacles = []
) {
  const blockingObstacles =
    findBlockingObstacles(
      source,
      target,
      obstacles
    );

  if (blockingObstacles.length === 0) {
    return {
      blocked: false,
      attenuation: 0,
      obstacles: []
    };
  }

  let attenuation = 0;

  for (const obstacle of blockingObstacles) {
    attenuation = Math.max(
      attenuation,
      obstacle.soundAttenuation ?? 1
    );
  }

  return {
    blocked: attenuation >= 1,
    attenuation,
    obstacles: blockingObstacles.map(
      (obstacle) => ({
        id: obstacle._id,
        type: obstacle.type,
        attenuation
      })
    )
  };
}

/**
 * Calculate distance attenuation.
 *
 * 0 px   = 1.0
 * 100 px = 0.0
 */
function calculateDistanceAttenuation(
  source,
  target,
  maxDistance = 100
) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;

  const distance = Math.sqrt(
    dx * dx + dy * dy
  );

  const normalized =
    Math.min(distance / maxDistance, 1);

  return {
    distance,
    gain: 1 - normalized
  };
}

/**
 * Calculate complete spatial audio state.
 */
function calculateSpatialAudio(
  source,
  target,
  obstacles = [],
  maxDistance = 100
) {
  const distanceResult =
    calculateDistanceAttenuation(
      source,
      target,
      maxDistance
    );

  const obstacleResult =
    calculateObstacleAttenuation(
      source,
      target,
      obstacles
    );

  const finalGain =
    distanceResult.gain *
    (1 - obstacleResult.attenuation);

  return {
    distance: Math.round(
      distanceResult.distance * 100
    ) / 100,

    distanceGain:
      Number(
        distanceResult.gain.toFixed(3)
      ),

    obstacleGain:
      Number(
        (1 - obstacleResult.attenuation).toFixed(3)
      ),

    finalGain:
      Number(
        finalGain.toFixed(3)
      ),

    blocked:
      obstacleResult.blocked,

    blockingObstacles:
      obstacleResult.obstacles
  };
}

module.exports = {
  segmentsIntersect,
  pathIntersectsObstacle,
  findBlockingObstacles,
  calculateObstacleAttenuation,
  calculateDistanceAttenuation,
  calculateSpatialAudio
};