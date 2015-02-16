AXIS.World = function(cellSize) {
  this._cellSize = cellSize || 64;

  this._grid = {};

  this._colliders = [];
  this._dynamicColliders = [];

  this._collidersHit = [];
};

AXIS.World.prototype = {
  update: function() {
    // first pass - sweep dynamic colliders into static colliders + add contacts
    this._dynamicColliders.forEach(function(collider){
      var sweep, fixDeltaX, fixDeltaY,
          staticColliders = [],
          AABBs = [];

      collider._positionInGridKeys.forEach(function(key){
        this._grid[key].forEach(function(otherCollider){
          if(collider !== otherCollider && !otherCollider._isDynamic) {
            staticColliders.push(otherCollider);
          }
        }, this);
      }, this);

      // AABB for sweep
      AABBs = staticColliders.map(function(collider){
        return collider._AABB;
      });

      sweep = collider._AABB.sweepInto(AABBs, collider._delta);

      // move collider to new position
      if(sweep.hit) {
        // add a little to the delta for collision callback colliders
        fixDeltaX = sweep.hit.delta.x - sweep.hit.normal.x;
        fixDeltaY = sweep.hit.delta.y - sweep.hit.normal.y;

        if(collider._collisionType === 'slide') {
          if(!sweep.hit.normal.x) {
            fixDeltaX = collider._delta.x;
          }
          else if(!sweep.hit.normal.y) {
            fixDeltaY = collider._delta.y;
          }
        }

        collider._AABB.pos.x += fixDeltaX;
        collider._AABB.pos.y += fixDeltaY;

        fixDeltaX = 0;
        fixDeltaY = 0;

        // add contacts
        staticColliders.forEach(function(staticCollider){
          var hitB = collider._AABB.intersectAABB(staticCollider._AABB);
          if(hitB) {
            hitA = staticCollider._AABB.intersectAABB(collider._AABB);
            this._addToCollidersHit(collider, staticCollider, hitA, hitB);

            if(hitA.normal.x > 0) {
              fixDeltaX = fixDeltaX < hitA.delta.x ? hitA.delta.x : fixDeltaX;
            }
            else if(hitA.normal.x < 0) {
              fixDeltaX = fixDeltaX > hitA.delta.x ? hitA.delta.x : fixDeltaX;
            }

            if(hitA.normal.y > 0) {
              fixDeltaY = fixDeltaY < hitA.delta.y ? hitA.delta.y : fixDeltaY;
            }
            else if(hitA.normal.y < 0) {
              fixDeltaY = fixDeltaY > hitA.delta.y ? hitA.delta.y : fixDeltaY;
            }
          }
        }, this);

        // move back to sweep position
        collider._AABB.pos.x += fixDeltaX;
        collider._AABB.pos.y += fixDeltaY;
      }
      else {
        // hit no static collider so move to next delta
        collider._AABB.pos.x += collider._delta.x;
        collider._AABB.pos.y += collider._delta.y;
      }

      this._placeInGrid(collider);

      // reset for next round
      collider._delta.x = 0;
      collider._delta.y = 0;
    }, this);

    // second pass - collision checks against dynamic + add contacts
    this._dynamicColliders.forEach(function(colliderA){
      colliderA._positionInGridKeys.forEach(function(key){
        this._grid[key].forEach(function(colliderB){
          if(colliderA !== colliderB && colliderB.isDynamic) {
            var hitA,
                hitB = colliderA._AABB.intersectAABB(colliderB._AABB);
            if(hitB) {
              hitA = colliderB._AABB.intersectAABB(colliderA._AABB);
              this._addToCollidersHit(colliderA, colliderB, hitA, hitB);
            }
          }
        }, this);
      }, this);
    }, this);

    // third pass - return contacts / cleanup
    this._collidersHit.forEach(function(c){
      if(c._collisionCallback) {
        c._collisionCallback(c._contacts);

        // cleanup for next round
        c._contacts = [];
      }
    }, this);

    // reset for next round
    this._collidersHit = [];
  },
  _addToCollidersHit: function(colliderA, colliderB, hitA, hitB) {
    // overwrite for collision callbacks to access collider
    hitA.collider = colliderB;
    hitB.collider = colliderA;

    colliderA._contacts.push(hitA);
    colliderB._contacts.push(hitB);

    if(this._collidersHit.indexOf(colliderA) === -1) {
      this._collidersHit.push(colliderA);
    }

    if(this._collidersHit.indexOf(colliderB) === -1) {
      this._collidersHit.push(colliderB);
    }
  },
  debugDrawGrid: function(callback) {
    var g, key, x, y, split,
        cellSize = this._cellSize;

    for(key in this._grid) {
      g = this._grid[key];
      split = key.split(/(\-?\d*)/);
      x = split[1] * cellSize;
      y = split[3] * cellSize;

      callback(x, y, cellSize, cellSize, g.length);
    }
  },
  debugDrawColliders: function(callback) {
    var x, y, cX, cY, w, h, isDyn;

    this._colliders.forEach(function(c){
      x = c._AABB.pos.x - c._AABB.half.x;
      y = c._AABB.pos.y - c._AABB.half.y;
      cX = x + c._AABB.half.x;
      cY = y + c._AABB.half.y;
      w = c._AABB.half.x*2;
      h = c._AABB.half.y*2;
      isDyn = c._isDynamic;

      callback(x, y, w, h, cX, cY, isDyn);
    }, this);
  },
  createCollider: function(x, y, width, height, isDynamic) {
    return new AXIS.Collider(this, x, y, width, height, isDynamic);
  },
  _addToGrid: function(x, y, collider) {
    var key = 'x'+x+'y'+y;

    if(!this._grid[key]) {
      this._grid[key] = [];
    }

    if(this._grid[key].indexOf(collider) === -1) {
      collider._positionInGridKeys.push(key);
      this._grid[key].push(collider);
    }
  },
  _placeInGrid: function(collider) {
    var gKey, keyX, keyY,
        x = 0,
        y = 0,
        posX = collider._AABB.pos.x - collider._AABB.half.x,
        posY = collider._AABB.pos.y - collider._AABB.half.y,
        cWidth = collider._AABB.half.x * 2,
        cHeight = collider._AABB.half.y * 2,
        cellSize = this._cellSize;

    // delete from last main grid position
    collider._positionInGridKeys.forEach(function(cgKey){
      gKey = this._grid[cgKey];

      gKey.splice(gKey.indexOf(collider), 1);

      if(!gKey.length) {
        delete this._grid[cgKey];
      }
    }, this);
    // reset collider grid keys after deleting from main grid
    collider._positionInGridKeys = [];

    for(;;) {
      keyX = Math.floor((x+posX) / cellSize);
      keyY = Math.floor((y+posY) / cellSize);

      this._addToGrid(keyX, keyY, collider);

      if(x === cWidth && y === cHeight) {
        break;
      }

      if(x === cWidth) {
        x = 0;
        y += cellSize;
        if(y > cHeight) {
          y = cHeight;
        }
      }
      else {
        x += cellSize;
      }

      if(x > cWidth) {
        x = cWidth;
      }
    }
  }
};
