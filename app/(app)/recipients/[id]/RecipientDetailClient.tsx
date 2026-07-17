"use client";
import { useState, useMemo } from "react";

const INK="#0B1220",CANVAS="#F4F6FA",CARD="#FFFFFF",BLUE="#2D6BFF",SLATE="#64748B",MUTE="#94A3B8",LINE="#E7EBF2",GREEN="#059669",GREEN_BG="#E7F7EF",RED="#DC2626";
const INTER="'Moderat', 'Inter', sans-serif";
const SHADOW="0 1px 3px rgba(11,18,32,0.04), 0 8px 24px rgba(11,18,32,0.05)";

type Sig={kind:string;page:number|null;value:unknown;created_at:string};
type Rec={id:string;label:string|null;shareToken:string;documentId:string;documentTitle:string};
type Verdict={headline:string;reasoning:string;nextAction:string;confidence:string;evidence:string[]};

export default function RecipientDetailClient({recipient,signals}:{recipient:Rec;signals:Sig[]}){
  const [verdict,setVerdict]=useState<Verdict|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  const summary=useMemo(()=>{
    const dwell:Record<number,number>={}; const questions:{text:string;escalated?:boolean;at:string}[]=[]; let opens=0;
    for(const s of signals){
      if(s.kind==="opened")opens++;
      if(s.kind==="page_dwell"&&s.page!=null&&s.value&&typeof s.value==="object"&&"ms" in s.value)dwell[s.page]=Number((s.value as {ms:number}).ms)||0;
      if(s.kind==="question"&&s.value&&typeof s.value==="object"&&"text" in s.value)questions.push({text:String((s.value as {text:string}).text),escalated:(s.value as {escalated?:boolean}).escalated,at:s.created_at});
    }
    return {dwell,questions,opens};
  },[signals]);

  const maxDwell=Math.max(1,...Object.values(summary.dwell));

  async function readTheReader(){
    setBusy(true);setError("");
    const res=await fetch("/api/verdict-live",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({recipientId:recipient.id})});
    const json=await res.json();
    if(!res.ok){setError(json.error??"Couldn't read the reader.");setBusy(false);return;}
    setVerdict(json.verdict);setBusy(false);
  }

  const mono={fontSize:13,fontWeight:500,color:SLATE};

  return (<div style={{fontFamily:INTER,color:INK,minHeight:"100vh"}}>
    <style>{`.fx-b{transition:box-shadow .15s,transform .1s;cursor:pointer}.fx-b:active{transform:translateY(1px)}`}</style>
    <div style={{padding:"28px 40px 0"}}>
      <a href="/recipients" style={{fontSize:13,color:SLATE,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:5,marginBottom:14}}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>Recipients
      </a>
      <h1 style={{fontSize:26,fontWeight:500,letterSpacing:"-0.015em",margin:"0 0 4px"}}>{recipient.label||"Unnamed reader"}</h1>
      <p style={{fontSize:14,color:SLATE,margin:0}}>on <a href={`/documents/${recipient.documentId}`} style={{color:BLUE,textDecoration:"none"}}>{recipient.documentTitle}</a></p>
    </div>

    {error&&<p style={{color:RED,fontSize:14,padding:"12px 40px 0"}}>{error}</p>}

    <main style={{maxWidth:760,padding:"24px 40px 40px"}}>
      {summary.opens===0?(
        <div style={{background:CARD,borderRadius:14,padding:32,boxShadow:SHADOW}}>
          <p style={{fontSize:15,color:SLATE,margin:0}}>This reader hasn't opened the document yet. Their read will appear here once they do.</p>
        </div>
      ):(<>
        <div style={{background:CARD,borderRadius:14,padding:24,marginBottom:18,boxShadow:SHADOW}}>
          <div style={{...mono,marginBottom:14}}>How they read</div>
          {Object.keys(summary.dwell).length===0?(<p style={{fontSize:14,color:SLATE,margin:0}}>Opened, no page dwell recorded yet.</p>):(
            Object.entries(summary.dwell).sort((a,b)=>Number(a[0])-Number(b[0])).map(([page,ms])=>(
              <div key={page} style={{display:"flex",alignItems:"center",gap:12,marginBottom:9}}>
                <span style={{fontSize:12,color:SLATE,width:52,fontWeight:500}}>Page {page}</span>
                <div style={{flex:1,height:8,background:CANVAS,borderRadius:20,overflow:"hidden",maxWidth:360}}><div style={{width:`${(Number(ms)/maxDwell)*100}%`,height:"100%",background:BLUE,borderRadius:20}}/></div>
                <span style={{fontSize:13,color:SLATE}}>{(Number(ms)/1000).toFixed(1)}s</span>
              </div>
            ))
          )}
        </div>

        {summary.questions.length>0&&(
          <div style={{background:CARD,borderRadius:14,padding:24,marginBottom:18,boxShadow:SHADOW}}>
            <div style={{...mono,marginBottom:14}}>What they asked · {summary.questions.length}</div>
            {summary.questions.map((q,i)=>(
              <div key={i} style={{background:CANVAS,borderRadius:10,padding:"12px 14px",marginBottom:8}}>
                <p style={{fontSize:15,margin:0}}>{q.text}</p>
                {q.escalated&&<span style={{fontSize:11,fontWeight:500,color:RED,marginTop:4,display:"inline-block"}}>Escalated — commercial question</span>}
              </div>
            ))}
          </div>
        )}

        <div style={{background:CARD,borderRadius:14,padding:24,boxShadow:SHADOW}}>
          <div style={{...mono,marginBottom:14}}>Verdict</div>
          {verdict?(
            <div style={{background:CANVAS,borderRadius:12,padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:12,fontWeight:500,color:SLATE}}>Reading</span>
                <span style={{fontSize:11,fontWeight:500,padding:"3px 10px",borderRadius:20,background:verdict.confidence==="high"?GREEN_BG:"#F1F5F9",color:verdict.confidence==="high"?GREEN:SLATE}}>{verdict.confidence} confidence</span>
              </div>
              <p style={{fontSize:20,fontWeight:500,lineHeight:1.3,letterSpacing:"-0.01em",margin:"0 0 10px"}}>{verdict.headline}</p>
              <p style={{fontSize:14,color:"#334155",lineHeight:1.6,margin:"0 0 14px"}}>{verdict.reasoning}</p>
              <div style={{background:"#fff",borderRadius:10,padding:"12px 14px"}}>
                <div style={{fontSize:12,fontWeight:500,color:BLUE,marginBottom:3}}>Do this next</div>
                <p style={{fontSize:15,fontWeight:500,margin:0}}>{verdict.nextAction}</p>
              </div>
            </div>
          ):(
            <button onClick={readTheReader} disabled={busy} className="fx-b" style={{background:BLUE,color:"#fff",border:"none",borderRadius:10,padding:"11px 20px",fontSize:14,fontWeight:500,fontFamily:INTER,boxShadow:"0 4px 12px rgba(45,107,255,0.25)"}}>{busy?"Reading…":"Read the reader"}</button>
          )}
        </div>
      </>)}
    </main>
  </div>);
}
