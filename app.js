const categories=['Best Offensive Player','Best Defensive Player','First Time All-Star','Biggest Break Out','Biggest Let Down'];
const brandBlue='#345494';
function currentSeason(){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'numeric'}).formatToParts(new Date());const year=Number(parts.find(p=>p.type==='year').value),month=Number(parts.find(p=>p.type==='month').value),start=month>=7?year:year-1;return `${start}–${String(start+1).slice(-2)}`;}
const key='allnba-preseason-v1', $=id=>document.getElementById(id);
let state={picks:[null,null,null,null,null],author:'',season:currentSeason()},players=[],active=0,ready=false;
try{const old=JSON.parse(localStorage.getItem(key));if(old&&Array.isArray(old.picks)&&old.picks.length===5)state={...state,...old};}catch{}
state.season=currentSeason();
$('author').value=state.author;
const canvas=$('board'),ctx=canvas.getContext('2d'),cache=new Map();
const exportScale=2;canvas.width=1080*exportScale;canvas.height=1350*exportScale;
function playerDetails(p){return [p.teamName,p.position].filter(Boolean).join(' · ');}
function image(src){if(!cache.has(src))cache.set(src,new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Could not load '+src));im.src=src;}));return cache.get(src)}
function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch{} render();}
function render(){
 const count=state.picks.filter(Boolean).length;$('count').textContent=`${count} OF 5`;
 $('picks').replaceChildren(...categories.map((name,i)=>{const p=state.picks[i],b=document.createElement('button');b.className='pick'+(p?' selected':'');b.setAttribute('aria-label',`${name}: ${p?p.name:'Choose player'}`);if(p){const im=document.createElement('img');im.src=`player_${p.id}_27.jpg`;im.alt='';b.append(im)}const copy=document.createElement('span');copy.className='copy';const strong=document.createElement('strong');strong.textContent=name;const small=document.createElement('small');small.textContent=p?p.name:'Choose your player';copy.append(strong,small);if(p&&playerDetails(p)){const details=document.createElement('span');details.className='player-details';details.textContent=playerDetails(p);copy.append(details);}const plus=document.createElement('span');plus.className='plus';plus.textContent=p?'↗':'+';b.append(copy,plus);b.onclick=()=>openPicker(i);return b}));
 $('export').disabled=count!==5||!ready;$('status').textContent=count===5?'Ready to export.':`${count}/5 selected.`; draw();
}
function openPicker(i){active=i;$('picker-title').textContent=categories[i];$('search').value='';$('remove').hidden=!state.picks[i];results();$('picker').showModal();$('search').focus()}
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
function results(){const q=normalize($('search').value),list=players.filter(p=>normalize([p.name,p.teamName,p.team,p.position].filter(Boolean).join(' ')).includes(q)).slice(0,60);$('results').replaceChildren(...list.map(p=>{const b=document.createElement('button');b.className='result';b.setAttribute('aria-label',`Select ${p.name}`);const im=document.createElement('img');im.loading='lazy';im.src=`player_${p.id}_27.jpg`;im.alt='';const n=document.createElement('span');n.textContent=p.name;b.append(im,n);if(playerDetails(p)){const details=document.createElement('small');details.className='player-details';details.textContent=playerDetails(p);b.append(details);}b.onclick=()=>{state.picks[active]=p;$('picker').close();save()};return b}));if(!list.length){const p=document.createElement('p');p.className='empty';p.textContent=players.length?'No players found. Try a different name.':'Loading player names…';$('results').append(p)}}
$('search').oninput=results;$('close').onclick=()=>$('picker').close();$('picker').addEventListener('click',e=>{if(e.target===$('picker')){const r=$('picker').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('picker').close()}});$('remove').onclick=()=>{state.picks[active]=null;$('picker').close();save()};
$('author').oninput=()=>{state.author=$('author').value;save()};
$('reset').onclick=()=>{state.picks=[null,null,null,null,null];save()};
let version=0,drawTask=Promise.resolve();
function text(t,x,y,size,color='#132c3c',font='Cooper',align='left',max=1000){ctx.fillStyle=color;ctx.textAlign=align;ctx.font=`${size}px ${font}`;while(ctx.measureText(t).width>max&&size>12){size--;ctx.font=`${size}px ${font}`}ctx.fillText(t,x,y)}
const shoulderPositions=new Map();
function shoulderLogoX(head,logo,h){
 const key=head.src+'|'+logo.src;if(shoulderPositions.has(key))return shoulderPositions.get(key);
 const mask=document.createElement('canvas');mask.width=360;mask.height=h;
 const m=mask.getContext('2d',{willReadFrequently:true}),ih=h+4,iw=head.width/head.height*ih;
 m.drawImage(head,838-iw/2-676,h-ih,iw,ih);const pixels=m.getImageData(0,0,360,h).data;
 const badge=document.createElement('canvas');badge.width=badge.height=84;const b=badge.getContext('2d',{willReadFrequently:true});b.drawImage(logo,0,0,84,84);const badgePixels=b.getImageData(0,0,84,84).data;
 let best=936,error=1;
 for(let x=860;x<=940;x++){let covered=0,total=0;for(let by=0;by<84;by+=2)for(let bx=0;bx<84;bx+=2){if(badgePixels[(by*84+bx)*4+3]<128)continue;total++;const px=x+bx-676,py=108+by;if(px>=0&&px<360&&py<h&&pixels[(py*360+px)*4+3]>128)covered++;}const e=Math.abs(covered/total-.25);if(e<error){error=e;best=x;}}
 shoulderPositions.set(key,best);return best;
}
function draw(){const v=++version;drawTask=(async()=>{try{await document.fonts.load('24px Cooper');const picks=[...state.picks];const [bg,logo,heads,teamLogos]=await Promise.all([image('ALLNBABkgdsquare.jpg'),image('LOGO.png'),Promise.all(picks.map(p=>p?image(`player_${p.id}_27.jpg`):null)),Promise.all(picks.map(p=>p?.team?image(`team-logos/${p.team}.png`):null))]);if(v!==version)return;
 ctx.setTransform(exportScale,0,0,exportScale,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.clearRect(0,0,1080,1350);ctx.drawImage(bg,0,0,1080,1350);ctx.fillStyle='#f5f3e9a8';ctx.fillRect(0,0,1080,1350);
 text('Preseason Predictions',40,110,82,brandBlue,'Cooper','left',810);ctx.drawImage(logo,858,22,190,184);text(currentSeason(),42,150,29,brandBlue);if(state.author.trim())text('@'+state.author.trim().replace(/^@+/,''),42,189,26,brandBlue,'Cooper','left',780);
 const y0=236,h=202,gap=13;
 categories.forEach((cat,i)=>{const y=y0+i*(h+gap),p=picks[i];ctx.fillStyle='#fffefaeb';ctx.fillRect(42,y,996,h);text(cat.toUpperCase(),64,y+39,29,'#777777','Cooper','left',610);
 text(p?p.name:'Your pick goes here',64,y+112,p?59:34,p?'#000000':'#9ba5aa','Cooper','left',610);
 if(p&&playerDetails(p))text(playerDetails(p),66,y+165,29,'#52616b','Cooper','left',600);
 ctx.save();ctx.beginPath();ctx.rect(676,y+2,360,h-4);ctx.clip();
 if(teamLogos[i]&&heads[i]){const x=shoulderLogoX(heads[i],teamLogos[i],h);ctx.drawImage(teamLogos[i],x,y+108,84,84);}
 if(heads[i]){const im=heads[i],ih=h+4,iw=im.width/im.height*ih;ctx.drawImage(im,838-iw/2,y+h-ih,iw,ih)}else{ctx.fillStyle='#e6eaf0';ctx.beginPath();ctx.arc(846,y+72,33,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(846,y+h,72,78,0,Math.PI,0);ctx.fill()}
 ctx.restore();ctx.strokeStyle=brandBlue;ctx.lineWidth=2;ctx.strokeRect(43,y+1,994,h-2);});
 ready=true;$('export').disabled=state.picks.filter(Boolean).length!==5;
 }catch(e){ready=false;$('status').textContent='An asset could not load. Refresh the page and try again.';$('export').disabled=true;console.error(e)}})();return drawTask}
$('export').onclick=async()=>{const button=$('export');button.disabled=true;try{await draw();const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));if(!blob)throw Error('PNG unavailable');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='all-nba-preseason-predictions.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);$('status').textContent='PNG downloaded.'}catch(e){$('status').textContent='Export failed. Please try again.';console.error(e)}finally{button.disabled=state.picks.filter(Boolean).length!==5}};
fetch('players.json').then(r=>{if(!r.ok)throw Error('Roster unavailable');return r.json()}).then(data=>{players=data;const valid=new Map(players.map(p=>[p.id,p]));state.picks=state.picks.map(p=>p&&valid.get(p.id)||null);render()}).catch(e=>{$('status').textContent='Could not load player names. Refresh to try again.';console.error(e)});render();
