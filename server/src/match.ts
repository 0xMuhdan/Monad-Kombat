export type MatchPlayer = { playerId: string; username: string; team: 'A' | 'B'; fighterId: string; x: number; y: number; hp: number; connected: boolean; sequence: number; attackReadyAt: number; skillReadyAt: number; ultimateReadyAt: number; burstReadyAt: number; attackFlashUntil: number; lastHitAt: number; eliminations: number; animation: 'idle' | 'attack' | 'hurt' | 'down' | 'skill'; animationUntil: number };
export type MatchState = { phase: 'playing' | 'finished'; tick: number; players: MatchPlayer[]; winner: 'A' | 'B' | null; resultSaved: boolean };
const WIDTH=1600,MAX_HP=100,SPEED=260,JUMP=180,MAX_TICKS=60*180; const rooms=new Map<string,MatchState>();
const canonicalFighters = new Set(['vex','rift','nova','nox','sable','forge','jinx','aero','orbit','ember','kite','moss']);
export function createMatch(code:string,players:MatchPlayer[]){if(players.some(player=>!canonicalFighters.has(player.fighterId)))throw new Error('Invalid Blitzbound fighter roster');const state:MatchState={phase:'playing',tick:0,players:players.map((p,i)=>({...p,x:p.team==='A'?300+i*90:WIDTH-300-i*90,y:0,hp:MAX_HP,connected:false,sequence:0,attackReadyAt:0,skillReadyAt:0,ultimateReadyAt:0,burstReadyAt:0,attackFlashUntil:0,lastHitAt:0,eliminations:0,animation:'idle',animationUntil:0})),winner:null,resultSaved:false};rooms.set(code,state);return snapshot(code)}
export function matchFor(code:string){return snapshot(code)}
export function advance(code:string){const state=rooms.get(code);if(state?.phase==='playing'){state.tick+=1;if(state.tick>=MAX_TICKS){state.phase='finished';state.winner=null}}return snapshot(code)}
export function input(code:string,playerId:string,message:{sequence:number;left?:boolean;right?:boolean}){const state=rooms.get(code);if(!state||state.phase!=='playing')throw new Error('Match is not active');const p=state.players.find(x=>x.playerId===playerId);if(!p||!p.connected)throw new Error('Player is not active');if(!Number.isSafeInteger(message.sequence)||message.sequence<=p.sequence)return snapshot(code);p.sequence=message.sequence;p.x+=(Number(Boolean(message.right))-Number(Boolean(message.left)))*SPEED/30;p.x=Math.max(80,Math.min(WIDTH-80,p.x));if(p.y>0){p.y=Math.max(0,p.y-8)}if(Date.now()>=p.animationUntil&&p.animation!=='down')p.animation='idle';return snapshot(code)}
export function attack(code:string,playerId:string,sequence:number){const state=rooms.get(code);if(!state||state.phase!=='playing')throw new Error('Match is not active');const a=state.players.find(x=>x.playerId===playerId);if(!a||!a.connected)throw new Error('Player is not active');if(!Number.isSafeInteger(sequence)||sequence<=a.sequence)return snapshot(code);a.sequence=sequence;const now=Date.now();if(now<a.attackReadyAt)return snapshot(code);a.attackReadyAt=now+350;a.attackFlashUntil=now+140;a.animation='attack';a.animationUntil=now+260;const target=state.players.find(x=>x.connected&&x.team!==a.team&&x.hp>0&&Math.abs(x.x-a.x)<=150);if(target){target.hp=Math.max(0,target.hp-10);target.lastHitAt=now;target.animation=target.hp===0?'down':'hurt';target.animationUntil=target.hp===0?Number.POSITIVE_INFINITY:now+320;if(target.hp===0)a.eliminations+=1;finishIfWiped(state)}return snapshot(code)}
export function disconnect(code:string,playerId:string){const state=rooms.get(code);if(!state)return null;const p=state.players.find(x=>x.playerId===playerId);if(p){p.connected=false;p.hp=0;p.animation='down';p.animationUntil=Number.POSITIVE_INFINITY}finishIfWiped(state);return snapshot(code)}
export function connect(code:string,playerId:string){const state=rooms.get(code);if(!state)return null;const p=state.players.find(x=>x.playerId===playerId);if(p)p.connected=true;return snapshot(code)}
function finishIfWiped(state:MatchState){const teamAWiped=state.players.filter(p=>p.team==='A').every(p=>!p.connected||p.hp<=0);const teamBWiped=state.players.filter(p=>p.team==='B').every(p=>!p.connected||p.hp<=0);if(teamAWiped&&teamBWiped){state.phase='finished';state.winner=null}else if(teamAWiped){state.phase='finished';state.winner='B'}else if(teamBWiped){state.phase='finished';state.winner='A'}}
function snapshot(code:string){const state=rooms.get(code);if(!state)throw new Error('Match not found');return structuredClone(state)}

export function jump(code:string,playerId:string,sequence:number){
  const state=rooms.get(code);if(!state||state.phase!=='playing')throw new Error('Match is not active');
  const p=state.players.find(x=>x.playerId===playerId);if(!p||!p.connected)throw new Error('Player is not active');
  if(!Number.isSafeInteger(sequence)||sequence<=p.sequence)return snapshot(code);
  p.sequence=sequence;p.y=JUMP;p.animation='skill';p.animationUntil=Date.now()+260;return snapshot(code);
}

export function special(code:string,playerId:string,sequence:number,kind:'skill'|'ultimate'|'burst'){
  const state=rooms.get(code);if(!state||state.phase!=='playing')throw new Error('Match is not active');
  const p=state.players.find(x=>x.playerId===playerId);if(!p||!p.connected)throw new Error('Player is not active');
  if(!Number.isSafeInteger(sequence)||sequence<=p.sequence)return snapshot(code);p.sequence=sequence;
  const now=Date.now();const cooldown=kind==='ultimate'?p.ultimateReadyAt:kind==='burst'?p.burstReadyAt:p.skillReadyAt;
  if(now<cooldown)return snapshot(code);
  if(kind==='ultimate')p.ultimateReadyAt=now+18000;else if(kind==='burst')p.burstReadyAt=now+22000;else p.skillReadyAt=now+3000;
  p.animation='skill';p.animationUntil=now+420;
  const damage=kind==='ultimate'?28:kind==='burst'?18:16;const range=kind==='burst'?260:kind==='ultimate'?230:190;
  const target=state.players.find(x=>x.connected&&x.team!==p.team&&x.hp>0&&Math.abs(x.x-p.x)<=range);
  if(target){target.hp=Math.max(0,target.hp-damage);target.lastHitAt=now;target.animation=target.hp===0?'down':'hurt';target.animationUntil=target.hp===0?Number.POSITIVE_INFINITY:now+420;if(target.hp===0)p.eliminations+=1;finishIfWiped(state)}
  return snapshot(code);
}
