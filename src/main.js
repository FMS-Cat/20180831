import './styles/main.scss';

// == import various modules / stuff ===========================================
import Automaton from '@fms-cat/automaton';
import CanvasSaver from './libs/canvas-saver.js';
import UltraCat from './libs/ultracat.js';
import Xorshift from './libs/xorshift.js';

import CONFIG from './config.json';

// == we are still struggling by this ==========================================
const $ = document.querySelector.bind( document );

// == hi xorshift ==============================================================
const xorshift = new Xorshift( CONFIG.seed );

// == hi canvas ================================================================
const canvas = $( '#canvas' );
const width = canvas.width = CONFIG.resolution[ 0 ];
const height = canvas.height = CONFIG.resolution[ 1 ];

const ctx = canvas.getContext( '2d' );
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

const line = ( x1, y1, x2, y2 ) => {
  ctx.beginPath();
  ctx.moveTo( x1, y1 );
  ctx.lineTo( x2, y2 );
  ctx.stroke();
};

const saver = new CanvasSaver( canvas, CONFIG.frames );

// == hi automaton =============================================================
let totalFrame = 0;
let isInitialFrame = true;

const automaton = new Automaton( {
  gui: $( '#divAutomaton' ),
  fps: CONFIG.fps,
  loop: true,
  data: require( './automaton.json' )
} );
const auto = automaton.auto;

automaton.addFxDefinition( 'mod', {
  name: 'Modulo',
  description: 'h',
  params: {
    d: { name: 'Division', type: 'float', default: 1.0, min: 0.0 }
  },
  func( context ) {
    const d = context.params.d;
    if ( d === 0.0 ) { return context.v; }
    return context.v - Math.floor( context.v / d ) * d;
  }
} );

automaton.addFxDefinition( 'repeat', {
  name: 'Repeat',
  description: 'I stole best animation curve feature from AfterEffects',
  params: {
    duration: { name: 'Duration', type: 'float', default: 1.0, min: 0.0 }
  },
  func( context ) {
    const d = context.params.duration;
    if ( d === 0.0 ) { return context.v; }

    const t = context.t0 + ( context.t - context.t0 ) % d;
    return context.getValue( t );
  }
} );

// == reflection particles (uh) ================================================
const refNum = CONFIG.reflectionNum;
let refIndex = 0;
const refs = new Array( refNum ).fill( 0 ).map( () => {
  return {
    x: 0,
    y: 0,
    life: 0.0,
    width: 0.0,
    color: '#ffffff'
  };
} );

// == mouse listener, why tho ==================================================
let mouseX = 0.0;
let mouseY = 0.0;

canvas.addEventListener( 'mousemove', ( event ) => {
  mouseX = event.offsetX;
  mouseY = event.offsetY;
} );

// == loop here ================================================================
const update = () => {
  if ( !$( '#active' ).checked ) {
    setTimeout( update, 100 );
    return;
  }

  // == init ===================================================================
  if ( automaton.time % automaton.length === 0 ) {
    refs.forEach( ( ref ) => {
      ref.life = 0.0;
    } );
    xorshift.set( CONFIG.seed );
  }

  // == various updates ========================================================
  automaton.update();

  // == background =============================================================
  ctx.fillStyle = '#ff6a3d';
  ctx.fillRect( 0, 0, width, height );

  for ( let iLayer = 0; iLayer < 2; iLayer ++ ) {
    ctx.strokeStyle = UltraCat.lerpHexColor(
      '#ff6a3d',
      '#ffa13d',
      auto( 'bg-blend' ) * ( 1.0 + iLayer ) / 2.0
    );
    ctx.lineWidth = width / 4;
    for ( let i = 0; i < 5; i ++ ) {
      const x = width / 4.5 * ( i + 0.1 + 0.3 * iLayer );
      const y = height * (
        auto( 'bg-height' + iLayer ) +
        0.04 * Math.sin( 2.0 * i + 3.0 * automaton.time + 0.4 * iLayer )
      );
      line( x, width / 4 + y, x, width / 4 + height );
    }
  }

  // == background done ========================================================
  const bufferBg = ctx.getImageData( 0, 0, width, height );
  ctx.clearRect( 0, 0, width, height );

  // == clouds =================================================================
  if ( auto( 'clouds-height' ) !== 0.0 ) {
    for ( let iLayer = 0; iLayer < 2; iLayer ++ ) {
      [
        { x: width / 10 * 1, y: height / 3, part: 2, offset: 5.0 },
        { x: width / 10 * 3, y: height / 2, part: 3, offset: 2.2 },
        { x: width / 10 * 5, y: height / 4, part: 2, offset: 1.0 }
      ].forEach( ( params ) => {
        for ( let i = 0; i < params.part; i ++ ) {
          ctx.strokeStyle = iLayer === 0 ? '#ffd09e' : '#ffffff';
          ctx.lineWidth = height / 16 * auto( 'clouds-height' );
          const x = (
            params.x
            - width / 48 * (
              iLayer * auto( 'clouds-height' )
              + 3.0 * Math.sin( 2.0 * i + params.offset )
              + Math.sin( 0.5 * i + 2.0 * automaton.time )
            )
          );
          const y = params.y + i * height / 32;
          line(
            x + width / 8 * auto( 'clouds-left' ), y,
            x + width / 8 * auto( 'clouds-right' ), y
          );
        }
      } );
    }
  }

  // == sun ====================================================================
  {
    const x = width / 5 * 4;
    const y = height * 0.45;
    const r0 = width / 12;
    const r = r0 * auto( 'sun-size' );
    const t0 = 2.0 * Math.PI * auto( 'sun-angle0' );
    const t1 = 2.0 * Math.PI * auto( 'sun-angle1' );

    // == sun - ring ===========================================================
    if ( auto( 'sun-angle0' ) !== auto( 'sun-angle1' ) ) {
      const rl = r0 - width / 128;
      ctx.lineWidth = width / 64;
      ctx.strokeStyle = '#ffd406';

      ctx.beginPath();
      ctx.moveTo( x + rl * Math.cos( t0 ), y + rl * Math.sin( t0 ) );
      ctx.arc( x, y, rl, t0, t1, false );
      ctx.moveTo( x + rl * Math.cos( t0 ), y + rl * Math.sin( t0 ) );
      ctx.stroke();
    }

    // == sun - body ===========================================================
    ctx.fillStyle = '#ffd406';
    ctx.beginPath();
    ctx.arc( x, y, r, 0, 2.0 * Math.PI, false );
    ctx.fill();

    // == sun - inside =========================================================
    const sr = width / 16 * auto( 'sun-size' );
    const sx = x - ( r - sr ) / Math.sqrt( 2.0 );
    const sy = y - ( r - sr ) / Math.sqrt( 2.0 );

    ctx.fillStyle = '#ffe565';
    ctx.beginPath();
    ctx.arc( sx, sy, sr * auto( 'sun-sizeI' ), 0, 2.0 * Math.PI, false );
    ctx.fill();

    // == sun - ray ============================================================
    const rr0 = r * ( 1.0 + auto( 'sun-ray0' ) );
    const rr1 = r * ( 1.0 + auto( 'sun-ray1' ) );

    if ( rr0 !== rr1 ) {
      ctx.lineWidth = Math.min( width / 64, ( rr1 - rr0 ) * 2.0 ) * auto( 'sun-size' );
      ctx.strokeStyle = '#ffd406';
      for ( let i = 0; i < 8; i ++ ) {
        const t = 2.0 * Math.PI * ( i / 8.0 + auto( 'sun-rayT' ) );
        line(
          x + rr0 * Math.cos( t ), y + rr0 * Math.sin( t ),
          x + rr1 * Math.cos( t ), y + rr1 * Math.sin( t )
        );
      }
    }
  }

  // == fetch fg ===============================================================
  const bufferFg = ctx.getImageData( 0, 0, width, height );

  // == 🔥🔥🔥🔥🔥🔥 ===========================================================
  ctx.fillStyle = '#ffffff';
  ctx.fillRect( 0, 0, width, height );
  const bufferFinal = ctx.getImageData( 0, 0, width, height );

  for ( let i = 0; i < width * height * 4; i += 4 ) {
    const a = bufferFg.data[ i + 3 ] / 255;
    bufferFinal.data[ i + 0 ] = UltraCat.lerp( bufferBg.data[ i + 0 ], bufferFg.data[ i + 0 ], a );
    bufferFinal.data[ i + 1 ] = UltraCat.lerp( bufferBg.data[ i + 1 ], bufferFg.data[ i + 1 ], a );
    bufferFinal.data[ i + 2 ] = UltraCat.lerp( bufferBg.data[ i + 2 ], bufferFg.data[ i + 2 ], a );
  }
  ctx.putImageData( bufferFinal, 0, 0 );

  // == ocean ==================================================================
  ctx.fillStyle = UltraCat.lerpHexColor(
    '#ff6a3d',
    '#9dff8e',
    auto( 'ocean-blend' )
  );
  const oceanHeight = height * ( 1.0 - auto( 'ocean-height' ) );
  ctx.fillRect( 0, oceanHeight, width, height );

  // == ocean reflections (most intense part) ==================================
  for ( let i = 0; i < CONFIG.reflectionPerFrame; i ++ ) {
    const x = refs[ refIndex ].x = width * xorshift.gen();
    const y = refs[ refIndex ].y = UltraCat.lofi( height / 4.0 * xorshift.gen(), height / 64.0 ) + height / 64.0;
    refs[ refIndex ].width = xorshift.gen() < 0.5 ? 0.5 : 1.0;

    const yFetch = Math.floor( oceanHeight - y );
    const iFetch = Math.max( 0, 4 * ( yFetch * width + Math.floor( x ) ) );
    const baseColor = UltraCat.arrayToHexColor( bufferFg.data.slice( iFetch, iFetch + 3 ) );

    if ( baseColor !== '#000000' ) {
      refs[ refIndex ].life = 1.0;
      refs[ refIndex ].color = UltraCat.lerpHexColor( '#9dff8e', baseColor, 0.5 );
      refIndex = ( refIndex + 1 ) % refNum;
    }
  }

  refs.forEach( ( ref ) => {
    if ( ref.life <= 0.0 ) { return; }

    const x0 = ref.x + width / 4.0 * ( Math.exp( -ref.life ) - 0.5 );
    const x1 = ref.x + width / 4.0 * ( 0.5 - Math.pow( ref.life, 2.0 ) );
    const y = oceanHeight + ref.y;
    ctx.lineWidth = Math.min( height / 32.0 * ref.width, Math.abs( x1 - x0 ) * 2.0 );
    ctx.strokeStyle = UltraCat.lerpHexColor(
      UltraCat.lerpHexColor( '#ff6a3d', '#9dff8e', auto( 'ocean-blend' ) ),
      ref.color,
      Math.pow( auto( 'ocean-blend' ), 2.0 )
    );
    line( x0, y, x1, y );

    ref.life -= automaton.deltaTime;
  } );

  // == shade ==================================================================
  ctx.lineWidth = width / 7 / 2;
  for ( let iLayer = 0; iLayer < 2; iLayer ++ ) {
    for ( let i = 0; i < 9; i ++ ) {
      ctx.fillStyle = ctx.strokeStyle = (
        iLayer === 0
          ? ( ( i % 2 === 0 ) ? '#dfdfdf' : '#e02500' )
          : ( ( i % 2 === 0 ) ? '#ffffff' : '#ff2a00' )
      );
      const args = [
        width / 7 * ( i + 0.25 ) - width * auto( 'shade-x' ),
        height * auto( 'shade-y' ) - height / 4 - width / 7 / 2,
        width / 7 / 2,
        height / 4 - height / 32 * iLayer
      ];
      ctx.fillRect( ...args );
      ctx.strokeRect( ...args );
    }
  }

  // == table ==================================================================
  ctx.lineWidth = width / 16;
  for ( let iLayer = 0; iLayer < 2; iLayer ++ ) {
    ctx.fillStyle = ctx.strokeStyle = iLayer === 0 ? '#d0d0d0' : '#eeeeee';
    const args = [
      width * ( auto( 'table-x' ) - iLayer / 32 ) - width / 32 - width / 2,
      height * ( auto( 'table-y' ) - iLayer / 32 ) + width / 32,
      width / 2,
      height / 4
    ];
    ctx.fillRect( ...args );
    ctx.strokeRect( ...args );
  }

  // == cocktail ===============================================================
  {
    ctx.save();
    ctx.translate(
      width * ( auto( 'table-x' ) - 0.2 ),
      height * ( auto( 'table-y' ) + 0.05 )
    );
    ctx.rotate( auto( 'cocktail-rotate' ) );

    // == cocktail - tube ======================================================
    ctx.strokeStyle = '#2eb56c';
    ctx.lineWidth = width / 48;
    line( width / 32 * 3, -height / 16 * 5, width / 32, -height / 16 * 3 );

    // == cocktail - glass =====================================================
    ctx.fillStyle = ctx.strokeStyle = '#56ceff';
    ctx.lineWidth = width / 48;

    line( -width / 16, 0, width / 16, 0 );
    line( 0, 0, 0, -height / 8 );

    ctx.lineWidth = width / 32;

    ctx.beginPath();
    ctx.moveTo( 0, -height / 8 );
    ctx.lineTo( width / 8, -height / 4 );
    ctx.lineTo( -width / 8, -height / 4 );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // == cocktail - fluid =====================================================
    for ( let iLayer = 0; iLayer < 3; iLayer ++ ) {
      ctx.fillStyle = UltraCat.lerpHexColor( '#f0c556', '#fe1fb7', iLayer / 2.0 );

      ctx.beginPath();
      ctx.moveTo( 0, -height / 8 );
      for ( let i = 0; i <= 32; i ++ ) {
        const wave = 1.0 - 0.15 * iLayer + Math.sin( i * 0.2 - auto( 'cocktail-fluid' ) ) / 32.0;
        ctx.lineTo(
          width * ( -1.0 / 8.0 + 1.0 / 4.0 * i / 32.0 ) * wave,
          height * ( -1.0 / 8.0 + -1.0 / 8.0 * wave )
        );
      }
      ctx.closePath();
      ctx.fill();
    }

    // == cocktail - shine =====================================================
    ctx.fillStyle = ctx.strokeStyle = '#56ceff';
    ctx.lineWidth = width / 64;

    line( -width / 32 * 2.5, -height / 32 * 7.5, -width / 32, -height / 32 * 6 );

    ctx.restore();
  }

  // == finalize the loop ======================================================
  isInitialFrame = false;
  totalFrame ++;

  // == save this? =============================================================
  if ( $( '#save' ).checked ) {
    saver.add();
  }

  requestAnimationFrame( update );
};

update();

// == keyboard is good =========================================================
window.addEventListener( 'keydown', ( event ) => {
  if ( event.which === 27 ) { // panic button
    $( '#active' ).checked = false;
  }

  if ( event.which === 32 ) { // play / pause
    automaton.isPlaying ? automaton.pause() : automaton.play();
  }
} );