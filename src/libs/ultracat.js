// お前、ナンデモアリかよ！

const UltraCat = {};

UltraCat.triangleStripQuad = [ -1, -1, 1, -1, -1, 1, 1, 1 ];
UltraCat.triangleStripQuad3 = [ -1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0 ];
UltraCat.triangleStripQuadNor = [ 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1 ];
UltraCat.triangleStripQuadUV = [ 0, 0, 1, 0, 0, 1, 1, 1 ];

// destructive
UltraCat.shuffleArrayD = ( array, dice ) => {
  const f = dice ? dice : () => Math.random();
  for ( let i = 0; i < array.length - 1; i ++ ) {
    const ir = i + Math.floor( f() * ( array.length - i ) );
    const temp = array[ ir ];
    array[ ir ] = array[ i ];
    array[ i ] = temp;
  }
  return array;
};

UltraCat.triIndexToLineIndex = ( array ) => {
  let ret = [];
  for ( let i = 0; i < array.length / 3; i ++ ) {
    const head = i * 3;
    ret.push(
      array[ head     ], array[ head + 1 ],
      array[ head + 1 ], array[ head + 2 ],
      array[ head + 2 ], array[ head     ]
    );
  }
  return ret;
};

UltraCat.matrix2d = ( w, h ) => {
  let arr = [];
  for ( let iy = 0; iy < h; iy ++ ) {
    for ( let ix = 0; ix < w; ix ++ ) {
      arr.push( ix, iy );
    }
  }
  return arr;
};

UltraCat.lerp = ( a, b, x ) => a + ( b - a ) * x;
UltraCat.clamp = ( x, l, h ) => Math.min( Math.max( x, l ), h );
UltraCat.saturate = ( x ) => Math.min( Math.max( x, 0.0 ), 1.0 );
UltraCat.linearstep = ( a, b, x ) => UltraCat.saturate( ( x - a ) / ( b - a ) );
UltraCat.smoothstep = ( a, b, x ) => {
  const t = UltraCat.linearstep( a, b, x );
  return t * t * ( 3.0 - 2.0 * t );
};

UltraCat.mod = ( x, d ) => ( x - Math.floor( x / d ) * d );
UltraCat.lofi = ( x, d ) => ( Math.floor( x / d ) * d )
UltraCat.lofir = ( x, d ) => ( Math.floor( x / d + 0.5 ) * d )

UltraCat.ExpSmooth = class {
  constructor( factor ) {
    this.factor = factor;
    this.value = 0.0;
  }

  update( value, dt ) {
    this.value = UltraCat.lerp( value, this.value, Math.exp( -this.factor * dt ) );
    return this.value;
  }
};

UltraCat.hexColorToArray = ( s ) => {
  const l = s.length;
  if ( l === 4 ) { // #rgb
    return [
      parseInt( s.slice( 1, 2 ), 16 ) * 17,
      parseInt( s.slice( 2, 3 ), 16 ) * 17,
      parseInt( s.slice( 3, 4 ), 16 ) * 17
    ];
  } else if ( l === 7 ) { // #rrggbb
    return [
      parseInt( s.slice( 1, 3 ), 16 ),
      parseInt( s.slice( 3, 5 ), 16 ),
      parseInt( s.slice( 5, 7 ), 16 )
    ];
  } else {
    throw new Error( 'Wait what' );
  }
};

UltraCat.arrayToHexColor = ( a ) => {
  let ret = '#';
  ret += ( '0' + UltraCat.clamp( parseInt( a[ 0 ] ), 0, 255 ).toString( 16 ) ).slice( -2 );
  ret += ( '0' + UltraCat.clamp( parseInt( a[ 1 ] ), 0, 255 ).toString( 16 ) ).slice( -2 );
  ret += ( '0' + UltraCat.clamp( parseInt( a[ 2 ] ), 0, 255 ).toString( 16 ) ).slice( -2 );
  return ret;
};

UltraCat.lerpHexColor = ( a, b, x ) => {
  const aa = UltraCat.hexColorToArray( a );
  const ab = UltraCat.hexColorToArray( b );
  return UltraCat.arrayToHexColor( [
    UltraCat.lerp( aa[ 0 ], ab[ 0 ], x ),
    UltraCat.lerp( aa[ 1 ], ab[ 1 ], x ),
    UltraCat.lerp( aa[ 2 ], ab[ 2 ], x )
  ] );
};

export default UltraCat;