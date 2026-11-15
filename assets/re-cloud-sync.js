(()=>{"use strict";
const API="https://reading-explorer-dictation.vercel.app/api/sync",STAMP="re3_cloud_sync_stamp_v1";
const keys=()=>Object.keys(localStorage).filter(k=>k.startsWith("re3_")&&k!==STAMP);
function snapshot(){const data={};keys().forEach(k=>data[k]=localStorage.getItem(k));return{version:1,data,updatedAt:Number(localStorage.getItem(STAMP)||0)}}
function hasLocal(){return keys().some(k=>localStorage.getItem(k)!==null)}
function apply(p){if(!p||!p.data)return;Object.entries(p.data).forEach(([k,v])=>{if(k.startsWith("re3_")&&k!==STAMP&&typeof v==="string")localStorage.setItem(k,v)});localStorage.setItem(STAMP,String(p.updatedAt||Date.now()))}
async function getCloud(){const r=await fetch(API,{cache:"no-store"});if(!r.ok)throw new Error("cloud read failed");return(await r.json()).profile}
async function push(){const s=snapshot();const r=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(s)});if(!r.ok)throw new Error("cloud write failed");const j=await r.json();if(j.profile?.updatedAt)localStorage.setItem(STAMP,String(j.profile.updatedAt));return j.profile}
async function initial(){try{const cloud=await getCloud(),local=snapshot();if(!cloud){if(hasLocal())await push();return}if(!hasLocal()||Number(cloud.updatedAt||0)>Number(local.updatedAt||0)){apply(cloud);window.dispatchEvent(new CustomEvent("re3-cloud-applied"));return}if(Number(local.updatedAt||0)>Number(cloud.updatedAt||0))await push()}catch(e){console.warn("RE cloud sync unavailable:",e.message)}}
let timer;function schedule(){clearTimeout(timer);timer=setTimeout(()=>push().catch(e=>console.warn("RE cloud sync failed:",e.message)),900)}
const orig=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){orig.call(this,k,v);if(this===localStorage&&String(k).startsWith("re3_")&&k!==STAMP)schedule()};
window.RECloudSync={sync:initial,push,getCloud};initial();window.addEventListener("focus",initial);document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")initial()});
})();