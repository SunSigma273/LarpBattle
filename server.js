const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer,WebSocket}=require('ws');
const PORT=process.env.PORT||3000, rooms=new Map();
const server=http.createServer((req,res)=>{if(req.url==='/health'){res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify({ok:true,rooms:rooms.size}));}if(req.url==='/'||req.url==='/index.html'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});return fs.createReadStream(path.join(__dirname,'index.html')).pipe(res);}res.writeHead(404);res.end('Not found');});
const wss=new WebSocketServer({server});
function send(ws,o){if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(o));}
function pub(r,o){for(const p of r.players)if(p)send(p.ws,o)}
function snap(r){return {type:'state',code:r.code,players:r.players.map((p,i)=>p?{seat:i,name:p.name,character:p.character,ready:p.ready,x:p.x,hp:p.hp}:null),started:r.started,remaining:r.remaining,winner:r.winner};}
function broadcast(r){pub(r,snap(r))}
function code(){let n;do{n=String(Math.floor(100000+Math.random()*900000))}while(rooms.has(n));return n}
wss.on('connection',ws=>{ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch{return send(ws,{type:'error',message:'Invalid message'});}
if(m.type==='create'){if(ws.room)return;let c=code(),r={code:c,players:[{ws,name:String(m.name||'Player 1').slice(0,20),character:'Kid',ready:false,x:100,hp:100},{ws:null}],started:false,remaining:60,winner:null,last:Date.now()};rooms.set(c,r);ws.room=c;ws.seat=0;send(ws,{type:'joined',seat:0,code:c});broadcast(r);}
else if(m.type==='join'){let r=rooms.get(String(m.code||''));if(!r)return send(ws,{type:'error',message:'Room code not found'});if(r.players[1].ws)return send(ws,{type:'error',message:'Room is full'});if(ws.room)return; r.players[1]={ws,name:String(m.name||'Player 2').slice(0,20),character:'Adult',ready:false,x:700,hp:100};ws.room=r.code;ws.seat=1;send(ws,{type:'joined',seat:1,code:r.code});broadcast(r);}
else {let r=rooms.get(ws.room),p=r&&r.players[ws.seat];if(!r||!p)return;
if(m.type==='ready'){p.ready=!!m.ready;broadcast(r);if(r.players.every(x=>x&&x.ws&&x.ready)&&!r.started){r.started=true;r.remaining=60;r.winner=null;r.players.forEach((x,i)=>{x.hp=100;x.x=i?700:100});pub(r,{type:'countdown',seconds:20});r.selectUntil=Date.now()+20000;broadcast(r);}}
if(m.type==='select'&&!r.started)p.character=['Kid','Adult','Sun','Ben','Dumb','Elsu','Butterfly','Bacon','Steve','Dragon'].includes(m.character)?m.character:p.character;
if(m.type==='input'&&r.started&&!r.winner){const q=r.players[1-ws.seat];if(!q)return;const dx=Math.max(-1,Math.min(1,Number(m.dx)||0));p.x=Math.max(25,Math.min(775,p.x+dx*7));if(m.attack&&Math.abs(p.x-q.x)<95&&Date.now()-(p.lastHit||0)>550){q.hp=Math.max(0,q.hp-8);p.lastHit=Date.now();if(q.hp===0)r.winner=ws.seat;}if(!r.winner&&Date.now()>=r.selectUntil+60000)r.winner=r.players[0].hp===r.players[1].hp?-1:(r.players[0].hp>r.players[1].hp?0:1);broadcast(r);}
if(m.type==='rematch'&&r.winner!==null){p.ready=true;if(r.players.every(x=>x&&x.ready)){r.started=false;r.winner=null;r.players.forEach(x=>{x.hp=100;x.ready=false});broadcast(r);}}
}}
);ws.on('close',()=>{let r=rooms.get(ws.room);if(!r)return;if(r.players[ws.seat])r.players[ws.seat]=null;pub(r,{type:'notice',message:'A player disconnected'});if(!r.players.some(Boolean))rooms.delete(r.code);else broadcast(r);});});
setInterval(()=>{for(const r of rooms.values())if(r.started&&!r.winner&&r.players.every(Boolean)){if(Date.now()>=r.selectUntil){r.remaining=Math.max(0,Math.ceil((r.selectUntil+60000-Date.now())/1000));if(r.remaining===0){r.winner=r.players[0].hp===r.players[1].hp?-1:(r.players[0].hp>r.players[1].hp?0:1);broadcast(r);}}}},250);
server.listen(PORT,'0.0.0.0',()=>console.log('LarpBattle listening on '+PORT));