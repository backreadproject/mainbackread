"use client";
const INK="#0A0E17",CARD="#FFFFFF",BLUE="#1D4ED8",SLATE="#475569",MUTE="#94A3B8",LINE="#E7EBF2";
const INTER="var(--font-geist-sans), system-ui, sans-serif";
const SHADOW="0 1px 3px rgba(11,18,32,0.04), 0 8px 24px rgba(11,18,32,0.05)";
function ago(iso:string){const s=Math.floor((Date.now()-new Date(iso).getTime())/1000);if(s<60)return"just now";if(s<3600)return`${Math.floor(s/60)}m ago`;if(s<86400)return`${Math.floor(s/3600)}h ago`;return`${Math.floor(s/86400)}d ago`;}
export default function ActivityClient({events}:{events:{text:string;at:string;docId?:string}[]}){
  return (<div style={{fontFamily:INTER,color:INK,minHeight:"100vh"}}>
    <main style={{maxWidth:680,padding:"28px 36px"}}>
      <h1 style={{fontSize:26,fontWeight:500,letterSpacing:"-0.015em",margin:"0 0 4px"}}>Activity</h1>
      <p style={{fontSize:14,color:SLATE,margin:"0 0 24px"}}>Everything your readers have done, newest first.</p>
      {events.length===0?(
        <div style={{background:CARD,borderRadius:14,padding:40,textAlign:"center",boxShadow:SHADOW}}>
          <p style={{fontSize:15,color:SLATE,margin:0}}>No activity yet. Share a document, and reads and questions show up here.</p>
        </div>
      ):(
        <div style={{background:CARD,borderRadius:14,overflow:"hidden",boxShadow:SHADOW}}>
          {events.map((e,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 20px",borderBottom:i<events.length-1?`1px solid ${LINE}`:"none"}}>
              <span style={{width:8,height:8,borderRadius:9,background:BLUE,flexShrink:0}}/>
              <span style={{fontSize:15,flex:1}}>{e.text}</span>
              <span style={{fontSize:13,color:MUTE,flexShrink:0}}>{ago(e.at)}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  </div>);
}
