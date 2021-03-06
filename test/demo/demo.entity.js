var DEMO = DEMO || {};

DEMO.Entity = function(world, x, y, zIndex) {
  this._position = {
    x: x || 0,
    y: y || 0
  };

  this.zIndex = zIndex || 0;

  this._isDynamic = false;

  // world reference used for components
  this.world = world;

  if(world) {
    world.entityManager.addEntity(this);
  }
};

DEMO.Entity.prototype = {
  moveTo: function(x, y) {
    if(this.collider) {
      this.collider.moveTo(x, y);
    }
    else {
      this._position.x = x;
      this._position.y = y;
    }
  },
  setUserData: function(data) {
    this.userData = data;

    return this;
  },
  setColliderResponseType: function(type) {
    if(this.collider) {
      this.collider.setResponseType(type);
    }
    return this;
  },
  setColliderGroupFilter: function(groupName, groupFilters) {
    if(this.collider) {
      this.collider.setGroupName(groupName);
      this.collider.setGroupFilters(groupFilters);
    }
    return this;
  },
  setColliderAsDynamic: function() {
    if(this.collider) {
      this.collider.setAsDynamic();
    }
  },
  setCollider: function(width, height, isSensor) {
    var cm = this.world.collisionManager,
        x = this._position.x,
        y = this._position.y,
        w = width,
        h = height,
        collider = cm.createCollider(x, y, w, h);

    if(isSensor) {
      collider.setSensor(isSensor);
    }

    // for access to entities on collisions
    collider.userData = this;

    this.collider = collider;

    return this;
  },
  removeCollider: function() {
    this.collider.remove();
    delete this.collider;
  },
  setLoop: function(script) {
    this._loop = script;

    return this;
  },
  onCollision: function(callback) {
    var entity = this;

    if(this.collider) {
      this.collider.setCollisionCallback(function(hits, touching) {
        var allHits = hits.map(function(hit){
          // add entity for quick access in callback
          hit.entity = hit.collider.userData;
          return hit;
        });

        callback.call(entity, allHits, touching);
      });
    }

    return this;
  }
};
