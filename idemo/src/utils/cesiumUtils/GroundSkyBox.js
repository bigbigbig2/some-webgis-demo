import {
  BoxGeometry,
  Cartesian3,
  defaultValue,
  defined,
  destroyObject,
  DeveloperError,
  GeometryPipeline,
  Matrix3,
  Matrix4,
  Transforms,
  VertexFormat,
  BufferUsage,
  CubeMap,
  DrawCommand,
  loadCubeMap,
  RenderState,
  VertexArray,
  BlendingState,
  SceneMode,
  ShaderProgram,
  ShaderSource
} from "cesium";

export class GroundSkyBox {
  constructor({viewer, sources, show = true}) {
    this.sources = sources;
    this.viewer = viewer;
    this.show = show;
    this.viewer.scene.skyAtmosphere.show = false;
    this.rewriteSkyBox();
  }

  rewriteSkyBox() {
    //片元着色器，直接从源码复制
    const SkyBoxFS = `
    #version 300 es
    uniform samplerCube u_cubeMap;
    in vec3 v_texCoord;
    out vec4 fragColor;
    void main()
    {
        vec4 color = texture(u_cubeMap, normalize(v_texCoord));
        fragColor = vec4(czm_gammaCorrect(color).rgb, czm_morphTime);
    }`;

    const SkyBoxVS = `
    #version 300 es
    in vec3 position;
    out vec3 v_texCoord;
    uniform mat3 u_rotateMatrix;
    void main()
    {
        vec3 p = czm_viewRotation * u_rotateMatrix * (czm_temeToPseudoFixed * (czm_entireFrustum.y * position));
        gl_Position = czm_projection * vec4(p, 1.0);
        v_texCoord = position;
    }`;

    /**
     * 为了兼容高版本的Cesium，因为新版cesium中getRotation被移除
     */
    if (!defined(Matrix4.getRotation)) {
      Matrix4.getRotation = Matrix4.getMatrix3;
    }
    function SkyBoxOnGround(options) {
      /**
       * 近景天空盒
       * @type Object
       * @default undefined
       */
      this.sources = options.sources;
      this._sources = undefined;

      /**
       * Determines if the sky box will be shown.
       *
       * @type {Boolean}
       * @default true
       */
      this.show = defaultValue(options.show, true);

      this._command = new DrawCommand({
        modelMatrix: Matrix4.clone(Matrix4.IDENTITY),
        owner: this
      });
      this._cubeMap = undefined;

      this._attributeLocations = undefined;
      this._useHdr = undefined;
    }
    const skyboxMatrix3 = new Matrix3();
    SkyBoxOnGround.prototype.update = function (frameState, useHdr) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const that = this;
      if (!this.show) {
        return undefined;
      }

      if (
        frameState.mode !== SceneMode.SCENE3D &&
        frameState.mode !== SceneMode.MORPHING
      ) {
        return undefined;
      }

      if (!frameState.passes.render) {
        return undefined;
      }

      const context = frameState.context;
      if (this._sources !== this.sources) {
        this._sources = this.sources;
        const sources = this.sources;

        if (
          !defined(sources.positiveX) ||
          !defined(sources.negativeX) ||
          !defined(sources.positiveY) ||
          !defined(sources.negativeY) ||
          !defined(sources.positiveZ) ||
          !defined(sources.negativeZ)
        ) {
          throw new DeveloperError(
            "this.sources is required and must have positiveX, negativeX, positiveY, negativeY, positiveZ, and negativeZ properties."
          );
        }

        if (
          typeof sources.positiveX !== typeof sources.negativeX ||
          typeof sources.positiveX !== typeof sources.positiveY ||
          typeof sources.positiveX !== typeof sources.negativeY ||
          typeof sources.positiveX !== typeof sources.positiveZ ||
          typeof sources.positiveX !== typeof sources.negativeZ
        ) {
          throw new DeveloperError(
            "this.sources properties must all be the same type."
          );
        }

        if (typeof sources.positiveX === "string") {
          // Given urls for cube-map images.  Load them.
          loadCubeMap(context, this._sources).then(function (cubeMap) {
            that._cubeMap = that._cubeMap && that._cubeMap.destroy();
            that._cubeMap = cubeMap;
          });
        } else {
          this._cubeMap = this._cubeMap && this._cubeMap.destroy();
          this._cubeMap = new CubeMap({
            context: context,
            source: sources
          });
        }
      }

      const command = this._command;

      command.modelMatrix = Transforms.eastNorthUpToFixedFrame(
        frameState.camera._positionWC
      );
      if (!defined(command.vertexArray)) {
        command.uniformMap = {
          u_cubeMap: function () {
            return that._cubeMap;
          },
          u_rotateMatrix: function () {
            return Matrix4.getRotation(command.modelMatrix, skyboxMatrix3);
          }
        };

        const geometry = BoxGeometry.createGeometry(
          BoxGeometry.fromDimensions({
            dimensions: new Cartesian3(2.0, 2.0, 2.0),
            vertexFormat: VertexFormat.POSITION_ONLY
          })
        );
        const attributeLocations = (this._attributeLocations =
          GeometryPipeline.createAttributeLocations(geometry));

        command.vertexArray = VertexArray.fromGeometry({
          context: context,
          geometry: geometry,
          attributeLocations: attributeLocations,
          bufferUsage: BufferUsage._DRAW
        });

        command.renderState = RenderState.fromCache({
          blending: BlendingState.ALPHA_BLEND
        });
      }

      if (!defined(command.shaderProgram) || this._useHdr !== useHdr) {
        const fs = new ShaderSource({
          defines: [useHdr ? "HDR" : ""],
          sources: [SkyBoxFS]
        });
        command.shaderProgram = ShaderProgram.fromCache({
          context: context,
          vertexShaderSource: SkyBoxVS,
          fragmentShaderSource: fs,
          attributeLocations: this._attributeLocations
        });
        this._useHdr = useHdr;
      }

      if (!defined(this._cubeMap)) {
        return undefined;
      }

      return command;
    };
    SkyBoxOnGround.prototype.isDestroyed = function () {
      return false;
    };
    SkyBoxOnGround.prototype.destroy = function () {
      const command = this._command;
      command.vertexArray =
        command.vertexArray && command.vertexArray.destroy();
      command.shaderProgram =
        command.shaderProgram && command.shaderProgram.destroy();
      this._cubeMap = this._cubeMap && this._cubeMap.destroy();
      return destroyObject(this);
    };
    this.viewer.scene.skyBox = new SkyBoxOnGround(this);
  }

  destroy() {
    if (this.viewer.scene.skyBox) {
      this.viewer.scene.skyBox.destroy();
      this.viewer.scene.skyBox = null;
    }
  }
}
