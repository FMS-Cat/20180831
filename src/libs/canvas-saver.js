const JSZip = require( 'jszip' );

let CanvasSaver = class {
  constructor( canvas, frames ) {
    this.canvas = canvas;

    this.inProgress = 0;
    this.queueDL = false;
    this.zip = new JSZip();
    this.anchor = document.createElement( 'a' );

    this.currentFrame = 0;
    this.maxFrames = parseInt( frames || 0 );
  }

  add( frame ) {
    if ( this.maxFrames && this.maxFrames <= this.currentFrame ) {
      return;
    }

    let filename = ( '0000' + this.currentFrame ).slice( -5 ) + '.png';
    this.inProgress ++;
    this.currentFrame ++;

    this.canvas.toBlob( ( blob ) => {
      this.zip.file( filename, blob );
      this.inProgress --;
      this.__done();
    } );

    if ( this.maxFrames && this.maxFrames === this.currentFrame ) {
      this.download();
    }
  }

  download() {
    this.queueDL = true;
    this.__done();
  }

  __done() {
    if ( this.queueDL && this.inProgress === 0 ) {
      this.queueDL = false;
      this.zip.generateAsync( { type: 'blob' } ).then( ( blob ) => {
        this.anchor.href = window.URL.createObjectURL( blob );
        this.anchor.download = 'canvasSaver-' + Date.now();
        this.anchor.click();
      } );
    }
  }
};

module.exports = CanvasSaver;