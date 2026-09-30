function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const P=['I','O','T','S','Z','J','L'];
function seq(seed,n){const r=mulberry32(seed);const out=[];while(out.length<n){const b=P.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[b[i],b[j]]=[b[j],b[i]]}out.push(...b)}return out.slice(0,n)}
function holes(seed,salt,n){const r=mulberry32((seed^salt)>>>0);return Array.from({length:n},()=>Math.floor(r()*10))}
const SY=0x9E3779B9, SR=0x85EBCA6B;
let found=[];
for(let s=1;s<50000000 && found.length<5;s++){
  const q=seq(s,16);
  if(q[5]!=='O'||q[12]!=='O'||q[13]!=='I'||q[14]!=='O'||q[15]!=='I')continue;
  const hy=holes(s,SY,2), hr=holes(s,SR,4);
  if(hy[0]!==2||hr[0]!==7||hy[1]===9||hy[1]===2)continue;
  if(hr[1]===hr[2]) continue;
  found.push({s:'0x'+s.toString(16),q:q.join(''),hy,hr});
}
console.log(found);
