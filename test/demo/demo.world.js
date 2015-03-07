var DEMO = DEMO || {};

DEMO.World = function(params) {
  var that = this;

  params = params || {};

  // this._uid = new Date().getTime();
  this._frameCount = 0;

  this.cellSize = params.cellSize || 32;
  this.debug = params.debug || false;
  this.renderer = params.renderer;
  this.entityManager = params.entityManager;
  this.collisionManager = params.collisionManager;
  this.inputs = new DEMO.Inputs(this);

  function collisionCallback(entities) {
    console.log(entities);
  }

  if(!params.collisionManager) {
    this.collisionManager = new Axis2D.World(this.cellSize);
    this.debugDraw = this.collisionManager.createDebugDraw();

    this.debugDraw.addGridCallback(
      function(x, y, width, height, colliderCount) {
        var rend = that.renderer;
        rend.setColor(175, 175, 175);
        rend.fillText(colliderCount, x + width/2, y + height/2);
        rend.strokeRect(x, y, width, height);
      }
    );

    this.debugDraw.addColliderCallback(
      function(x, y, width, height, isSensor) {
        var rend = that.renderer,
            r = isSensor ? 255 : 0,
            g = 255,
            b = 255;

        rend.setColor(r, g, b, 0.25);
        rend.fillRect(x, y, width, height);

        rend.setColor(r, g, b);
        rend.strokeRect(x, y, width, height);
      }
    );

    this.collisionManager.setCollisionCallback(function(colliders) {
      var entities = colliders.map(function(collider){
        return collider.userData;
      });
      collisionCallback(entities);
    });
  }

  if(!params.entityManager) {
    this.entityManager = new DEMO.EntityManager(this);
  }
};

DEMO.World.prototype = {
  createEntity: function(x, y, z) {
    return new DEMO.Entity(this, x, y, z);
  },
  update: function() {
    this.entityManager.update();
    this.collisionManager.update();
    this._frameCount++;
  },
  draw: function() {
    if(this.renderer) {
      this.renderer.setFont('Arial', 16, 'center', 'middle');

      if(this.debug) {
        this.collisionManager.debugDraw();
      }

      this.renderer.setColor(255, 255, 255);
      this.renderer.fillText(
        'Colliders: ' + this.collisionManager.countColliders(),
        this.renderer._width/2,
        16
      );
      this.renderer.fillText(
        'Grid cells: ' + this.collisionManager.countGridCells(),
        this.renderer._width/2,
        32
      );
    }
  }
};